"""BCM-GHCP FastAPI application.

Uses the GitHub Copilot SDK (github-copilot-sdk) to power the agent.
The SDK manages the Copilot CLI process and handles LLM communication
via JSON-RPC. Custom tools are defined with @define_tool in agent/tools.py.
"""

from __future__ import annotations

import json
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from app.agent.client import (
    get_client,
    run_assessment as agent_run_assessment,
    run_chat,
    stop_client,
)
from app.config import settings
from app.models.schemas import (
    AssessmentRequest,
    ChatMessage,
)
from app.services.mock_data import MOCK_SUBSCRIPTIONS

app = FastAPI(
    title="BCM-GHCP",
    description="BCM/DR & FinOps Assessment Agent API — powered by GitHub Copilot SDK",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Pre-start the CopilotClient so the CLI process is ready."""
    try:
        await get_client()
    except Exception as e:
        import logging

        logging.getLogger(__name__).warning(
            f"Copilot CLI not available at startup: {e}. Agent features will initialize on first request."
        )


@app.on_event("shutdown")
async def shutdown():
    """Stop the CopilotClient and underlying CLI process."""
    await stop_client()


# --- Health ---


@app.get("/api/health")
async def health():
    return {"status": "ok", "mode": settings.mode}


# --- Mock data endpoints ---


@app.get("/api/mock/subscriptions")
async def list_mock_subscriptions():
    return MOCK_SUBSCRIPTIONS


# --- Assessment (SSE streaming via Copilot SDK) ---


@app.post("/api/assess")
async def run_assessment(request: AssessmentRequest):
    """
    Run a full BCM assessment.

    Tries the Copilot SDK agent first (SSE stream). If the CLI is unavailable,
    falls back to running tools directly and returning JSON.
    """
    try:
        # Try SSE streaming via Copilot SDK
        session_id = str(uuid.uuid4())

        async def event_generator():
            yield {"event": "session", "data": json.dumps({"session_id": session_id})}

            async for agent_event in agent_run_assessment(
                subscription_id=request.subscription_id,
                use_mock=request.use_mock,
            ):
                yield {
                    "event": agent_event.type.value,
                    "data": agent_event.model_dump_json(exclude_none=True),
                }

            # After agent completes, send structured assessment data
            structured = await _get_structured_result(request)
            yield {
                "event": "assessment_complete",
                "data": json.dumps(
                    {"type": "assessment_complete", "result": structured}
                ),
            }

        return EventSourceResponse(event_generator())
    except Exception:
        # Fallback: run tools directly without the agent
        return await _run_assessment_fallback(request)


async def _run_assessment_fallback(request: AssessmentRequest):
    """Direct tool execution fallback when Copilot CLI is not available."""
    return await _get_structured_result(request)


async def _get_structured_result(request: AssessmentRequest) -> dict:
    """Run tools directly and return structured assessment data."""
    from app.services.azure_discovery import discover_resources
    from app.services.budget import get_budget
    from app.services.cmdb import get_cmdb_entry
    from app.services.pilot_light import generate_pilot_light_plan

    inventory = await discover_resources(
        request.subscription_id, use_mock=request.use_mock
    )
    budget = await get_budget(request.subscription_id)
    cmdb = await get_cmdb_entry(request.subscription_id)
    plan = await generate_pilot_light_plan(request.subscription_id)

    return {
        "subscription_id": request.subscription_id,
        "resources": inventory.model_dump(),
        "budget": budget.model_dump(),
        "cmdb": cmdb.model_dump(),
        "plan": plan.model_dump(),
    }


# --- Chat (SSE streaming via Copilot SDK) ---


@app.post("/api/chat")
async def chat(message: ChatMessage):
    """
    Send a follow-up message to the agent via the Copilot SDK.
    Returns an SSE stream of response events.
    """
    session_id = message.session_id or str(uuid.uuid4())

    async def event_generator():
        async for agent_event in run_chat(
            session_id=session_id,
            message=message.content,
        ):
            yield {
                "event": agent_event.type.value,
                "data": agent_event.model_dump_json(exclude_none=True),
            }

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
