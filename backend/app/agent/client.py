"""
GitHub Copilot SDK client for the BCM Assessment Agent.

Manages the CopilotClient lifecycle (which spawns/connects to the Copilot CLI
via JSON-RPC) and provides session creation with our custom BCM tools.

Architecture:
    FastAPI App
        ↓
    CopilotClient (this module)
        ↓ JSON-RPC
    Copilot CLI (server mode, auto-managed by SDK)
        ↓
    LLM (via GitHub Copilot)
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, AsyncGenerator

from copilot import CopilotClient, PermissionHandler
from copilot.types import SystemMessageAppendConfig

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import ALL_TOOLS, set_progress_queue, clear_progress_queue
from app.models.schemas import AgentEvent, AgentEventType

logger = logging.getLogger(__name__)

# Singleton client — started once, shared across requests
_client: CopilotClient | None = None
_client_lock = asyncio.Lock()


async def get_client() -> CopilotClient:
    """Get or create the singleton CopilotClient."""
    global _client
    async with _client_lock:
        if _client is None:
            _client = CopilotClient()
            await _client.start()
            logger.info("CopilotClient started (Copilot CLI process managed by SDK)")
        return _client


async def stop_client() -> None:
    """Stop the CopilotClient and the underlying Copilot CLI process."""
    global _client
    async with _client_lock:
        if _client is not None:
            await _client.stop()
            _client = None
            logger.info("CopilotClient stopped")


async def run_assessment(
    subscription_id: str,
    use_mock: bool = True,
) -> AsyncGenerator[AgentEvent, None]:
    """
    Run a BCM assessment as a streaming sequence of AgentEvents.

    Creates a Copilot SDK session with our custom tools and system prompt,
    sends the assessment request, and yields events as the agent thinks,
    calls tools, and generates its final response.
    """
    client = await get_client()

    # Create a session with our BCM tools and Pilot Light knowledge
    event_queue: asyncio.Queue[AgentEvent | None] = asyncio.Queue()
    progress_queue: asyncio.Queue[dict] = asyncio.Queue()
    set_progress_queue(progress_queue)  # Wire tool progress into our queue
    _tool_start_times: dict[str, float] = {}
    _tool_names: dict[str, str] = {}
    _has_response_content = False

    def on_event(event: Any) -> None:
        nonlocal _has_response_content
        event_type = (
            event.type.value if hasattr(event.type, "value") else str(event.type)
        )
        data = event.data

        # --- Tool call events ---
        if event_type == "tool.execution_start":
            tool_name = (
                getattr(data, "tool_name", None)
                or getattr(data, "name", None)
                or "unknown"
            )
            tool_call_id = getattr(data, "tool_call_id", None) or ""
            _tool_start_times[tool_call_id] = asyncio.get_event_loop().time()
            _tool_names[tool_call_id] = tool_name
            event_queue.put_nowait(
                AgentEvent(type=AgentEventType.TOOL_CALL_START, tool=tool_name)
            )

        elif event_type == "tool.execution_complete":
            tool_call_id = getattr(data, "tool_call_id", None) or ""
            duration_ms = 0
            if tool_call_id in _tool_start_times:
                duration_ms = int(
                    (
                        asyncio.get_event_loop().time()
                        - _tool_start_times.pop(tool_call_id)
                    )
                    * 1000
                )
            tool_name = (
                _tool_names.pop(tool_call_id, None)
                or getattr(data, "tool_name", None)
                or getattr(data, "name", None)
            )
            event_queue.put_nowait(
                AgentEvent(
                    type=AgentEventType.TOOL_CALL_END,
                    tool=tool_name,
                    duration_ms=duration_ms,
                )
            )

        # --- Streaming response ---
        elif event_type == "assistant.message_delta":
            delta = getattr(data, "delta_content", "") or ""
            if delta:
                if not _has_response_content:
                    # First content delta — emit response_start
                    _has_response_content = True
                    event_queue.put_nowait(
                        AgentEvent(type=AgentEventType.RESPONSE_START)
                    )
                event_queue.put_nowait(
                    AgentEvent(type=AgentEventType.RESPONSE_DELTA, content=delta)
                )

        # --- Reasoning / thinking ---
        elif event_type == "assistant.reasoning_delta":
            delta = getattr(data, "delta_content", "") or ""
            if delta:
                event_queue.put_nowait(
                    AgentEvent(type=AgentEventType.THINKING_DELTA, content=delta)
                )

        elif event_type == "assistant.reasoning":
            event_queue.put_nowait(AgentEvent(type=AgentEventType.THINKING_END))

        # --- Final message (skip empty ones from tool-calling turns) ---
        elif event_type == "assistant.message":
            content = getattr(data, "content", "") or ""
            if content:
                event_queue.put_nowait(
                    AgentEvent(type=AgentEventType.RESPONSE_END, content=content)
                )

        elif event_type == "session.idle":
            event_queue.put_nowait(None)  # Signal completion

    session = await client.create_session(
        model="gpt-4.1",
        streaming=True,
        tools=ALL_TOOLS,
        system_message=SystemMessageAppendConfig(content=SYSTEM_PROMPT),
        on_permission_request=PermissionHandler.approve_all,
        on_event=on_event,
    )

    # Yield the user message event
    mock_label = " (demo mode)" if use_mock else ""
    prompt = (
        f"Assess Azure subscription {subscription_id}{mock_label}. "
        f"You MUST call ALL 4 tools in this order:\n"
        f"1. assess_azure_resources (with use_mock={use_mock})\n"
        f"2. get_budget_status\n"
        f"3. query_cmdb\n"
        f"4. suggest_pilot_light_plan\n"
        f"After calling all tools, provide a comprehensive summary."
    )
    yield AgentEvent(type=AgentEventType.USER_MESSAGE, content=prompt)

    await session.send(prompt)

    # Stream events from both queues until session.idle
    while True:
        # Drain any pending progress events first
        while not progress_queue.empty():
            try:
                prog = progress_queue.get_nowait()
                yield AgentEvent(
                    type=AgentEventType.TOOL_CALL_PROGRESS,
                    tool=prog.get("tool"),
                    content=prog.get("message"),
                )
            except asyncio.QueueEmpty:
                break

        # Wait for the next agent event (with a short timeout to check progress)
        try:
            event = await asyncio.wait_for(event_queue.get(), timeout=0.1)
        except asyncio.TimeoutError:
            continue

        if event is None:
            break
        yield event

    clear_progress_queue()
    await session.disconnect()


async def run_chat(
    session_id: str,
    message: str,
) -> AsyncGenerator[AgentEvent, None]:
    """
    Send a follow-up chat message to the agent.
    Creates a new session per chat turn (stateless for V1).
    """
    client = await get_client()

    event_queue: asyncio.Queue[AgentEvent | None] = asyncio.Queue()
    _tool_start_times: dict[str, float] = {}

    def on_event(event: Any) -> None:
        event_type = (
            event.type.value if hasattr(event.type, "value") else str(event.type)
        )
        data = event.data

        if event_type == "tool.execution_start":
            tool_name = (
                getattr(data, "tool_name", None)
                or getattr(data, "name", None)
                or "unknown"
            )
            tool_call_id = getattr(data, "tool_call_id", None) or ""
            _tool_start_times[tool_call_id] = asyncio.get_event_loop().time()
            event_queue.put_nowait(
                AgentEvent(
                    type=AgentEventType.TOOL_CALL_START,
                    tool=tool_name,
                    input={"tool_call_id": tool_call_id},
                )
            )
        elif event_type == "tool.execution_complete":
            tool_call_id = getattr(data, "tool_call_id", None) or ""
            duration_ms = 0
            if tool_call_id in _tool_start_times:
                duration_ms = int(
                    (
                        asyncio.get_event_loop().time()
                        - _tool_start_times.pop(tool_call_id)
                    )
                    * 1000
                )
            tool_name = getattr(data, "tool_name", None) or getattr(data, "name", None)
            event_queue.put_nowait(
                AgentEvent(
                    type=AgentEventType.TOOL_CALL_END,
                    tool=tool_name,
                    duration_ms=duration_ms,
                )
            )
        elif event_type == "assistant.turn_start":
            event_queue.put_nowait(AgentEvent(type=AgentEventType.THINKING_START))
        elif event_type == "assistant.message_delta":
            delta = getattr(data, "delta_content", "") or ""
            if delta:
                event_queue.put_nowait(
                    AgentEvent(type=AgentEventType.RESPONSE_DELTA, content=delta)
                )
        elif event_type == "assistant.message":
            content = getattr(data, "content", "") or ""
            event_queue.put_nowait(
                AgentEvent(type=AgentEventType.RESPONSE_END, content=content)
            )
        elif event_type == "session.idle":
            event_queue.put_nowait(None)

    session = await client.create_session(
        model="gpt-4.1",
        streaming=True,
        tools=ALL_TOOLS,
        system_message=SystemMessageAppendConfig(content=SYSTEM_PROMPT),
        on_permission_request=PermissionHandler.approve_all,
        on_event=on_event,
    )

    yield AgentEvent(type=AgentEventType.USER_MESSAGE, content=message)

    await session.send(message)

    while True:
        event = await event_queue.get()
        if event is None:
            break
        yield event

    await session.disconnect()
