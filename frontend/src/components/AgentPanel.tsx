import { useEffect, useRef, useState } from "react";
import { useAssessmentStore } from "../store/assessment";
import { AgentTimelineEntry } from "./AgentTimelineEntry";
import type { AssessmentResult, TimelineEntry } from "../types";
import { Loader2, MessageSquare, Send } from "lucide-react";

/**
 * Left panel - Agent Activity Feed.
 * Shows the VS Code Agent Mode-style timeline of tool calls,
 * thinking steps, and agent responses.
 */
export function AgentPanel() {
  const {
    subscriptionId,
    useMock,
    isAssessing,
    timeline,
    addTimelineEntry,
    updateTimelineEntry,
    setAssessmentResult,
    setIsAssessing,
  } = useAssessmentStore();

  const hasStarted = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState("");

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // Run assessment on mount
  useEffect(() => {
    if (!subscriptionId || hasStarted.current) return;
    hasStarted.current = true;

    void runAssessment(subscriptionId, useMock, {
      addTimelineEntry,
      updateTimelineEntry,
      setAssessmentResult,
      setIsAssessing,
    });
  }, [subscriptionId]);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAssessing) return;
    const message = chatInput.trim();
    setChatInput("");
    setIsAssessing(true);

    addTimelineEntry({
      id: `user-${Date.now()}`,
      type: "user",
      status: "complete",
      timestamp: Date.now(),
      content: message,
    });

    // Call the chat endpoint via SSE
    void runChat(message, {
      addTimelineEntry,
      updateTimelineEntry,
      setAssessmentResult,
      setIsAssessing,
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">Agent Activity</span>
        {isAssessing && (
          <Loader2 className="ml-auto h-3 w-3 animate-spin text-agent-tool" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-end px-8 py-6 space-y-3">
          {timeline.map((entry) => (
            <AgentTimelineEntry key={entry.id} entry={entry} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Chat input */}
      <div className="border-t border-border bg-surface">
        <form onSubmit={handleChat} className="px-8 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder={
                isAssessing
                  ? "Assessment in progress..."
                  : "Ask a follow-up question or type 'generate artefacts' to proceed..."
              }
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isAssessing}
              className="h-11 w-full rounded-lg border border-border bg-background pl-4 pr-12 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isAssessing}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-30 disabled:bg-muted"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Assessment runner (SSE stream from Copilot SDK backend) ---

const TOOL_LABELS: Record<string, string> = {
  assess_azure_resources: "Discovering Azure resources",
  get_budget_status: "Checking budget status",
  query_cmdb: "Querying CMDB",
  suggest_pilot_light_plan: "Generating Pilot Light plan",
};

async function runAssessment(
  subscriptionId: string,
  useMock: boolean,
  actions: {
    addTimelineEntry: (e: TimelineEntry) => void;
    updateTimelineEntry: (id: string, u: Partial<TimelineEntry>) => void;
    setAssessmentResult: (r: AssessmentResult) => void;
    setIsAssessing: (v: boolean) => void;
  },
) {
  // User message
  actions.addTimelineEntry({
    id: "user-0",
    type: "user",
    status: "complete",
    timestamp: Date.now(),
    content: `Assess subscription ${subscriptionId}${useMock ? " (demo mode)" : ""}`,
  });

  try {
    // Open SSE connection to the backend assessment endpoint
    const response = await fetch("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription_id: subscriptionId,
        use_mock: useMock,
      }),
    });

    if (!response.ok) {
      throw new Error(`Assessment failed: ${response.statusText}`);
    }

    // Check if we got an SSE stream or a JSON response
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("text/event-stream")) {
      // SSE stream - process events from Copilot SDK agent
      await processSSEStream(response, actions);
    } else {
      // Fallback: JSON response (when Copilot CLI is not available)
      await processFallbackJSON(response, subscriptionId, actions);
    }
  } catch (err) {
    actions.addTimelineEntry({
      id: "error-0",
      type: "error",
      status: "error",
      timestamp: Date.now(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
    actions.setIsAssessing(false);
  }
}

/** Process SSE events streamed from the Copilot SDK agent */
async function processSSEStream(
  response: Response,
  actions: {
    addTimelineEntry: (e: TimelineEntry) => void;
    updateTimelineEntry: (id: string, u: Partial<TimelineEntry>) => void;
    setAssessmentResult: (r: AssessmentResult) => void;
    setIsAssessing: (v: boolean) => void;
  },
) {
  const {
    addTimelineEntry,
    updateTimelineEntry,
    setAssessmentResult,
    setIsAssessing,
  } = actions;
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let responseId: string | null = null;
  let responseContent = "";
  // Track tool entries by name so we can match start → end
  const toolEntryIds = new Map<string, string>();
  let toolCounter = 0;

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      try {
        const event = JSON.parse(raw);
        const eventType = event.type as string;

        switch (eventType) {
          // --- Tool calls ---
          case "tool_call_start": {
            const toolName = event.tool ?? "unknown";
            const entryId = `tool-${toolCounter++}`;
            toolEntryIds.set(toolName, entryId);
            addTimelineEntry({
              id: entryId,
              type: "tool_call",
              status: "in_progress",
              timestamp: Date.now(),
              tool: toolName,
              content: TOOL_LABELS[toolName] ?? toolName,
              progressMessages: [],
            });
            break;
          }

          case "tool_call_end": {
            const toolName = event.tool ?? "";
            const entryId = toolEntryIds.get(toolName);
            if (entryId) {
              updateTimelineEntry(entryId, {
                status: "complete",
                durationMs: event.duration_ms,
              });
              toolEntryIds.delete(toolName);
            }
            break;
          }

          case "tool_call_error": {
            const toolName = event.tool ?? "";
            const entryId = toolEntryIds.get(toolName);
            if (entryId) {
              updateTimelineEntry(entryId, {
                status: "error",
                error: event.error,
              });
            }
            break;
          }

          case "tool_call_progress": {
            const toolName = event.tool ?? "";
            const entryId = toolEntryIds.get(toolName);
            if (entryId) {
              // Append progress message to the tool's sub-steps
              const msg = event.content ?? "";
              if (msg) {
                // We need to read current state via the store
                const state = useAssessmentStore.getState();
                const entry = state.timeline.find((e) => e.id === entryId);
                const existing = entry?.progressMessages ?? [];
                updateTimelineEntry(entryId, {
                  progressMessages: [...existing, msg],
                });
              }
            }
            break;
          }

          // --- Agent response (streaming) ---
          case "response_start": {
            responseId = `response-${Date.now()}`;
            responseContent = "";
            addTimelineEntry({
              id: responseId,
              type: "response",
              status: "in_progress",
              timestamp: Date.now(),
              content: "",
            });
            break;
          }

          case "response_delta": {
            const delta = event.content ?? "";
            if (!delta) break;
            responseContent += delta;
            if (!responseId) {
              // Auto-create response entry on first content
              responseId = `response-${Date.now()}`;
              addTimelineEntry({
                id: responseId,
                type: "response",
                status: "in_progress",
                timestamp: Date.now(),
                content: responseContent,
              });
            } else {
              updateTimelineEntry(responseId, { content: responseContent });
            }
            break;
          }

          case "response_end": {
            const content = event.content ?? "";
            if (!content && !responseId) break; // Skip empty response_end from tool-calling turns
            if (responseId) {
              updateTimelineEntry(responseId, {
                status: "complete",
                content: content || responseContent,
              });
            } else if (content) {
              // Got a final response without prior deltas
              addTimelineEntry({
                id: `response-${Date.now()}`,
                type: "response",
                status: "complete",
                timestamp: Date.now(),
                content,
              });
            }
            responseId = null;
            responseContent = "";
            break;
          }

          // --- Thinking (reasoning) ---
          case "thinking_start":
            // Don't render - tool calls are the visible activity
            break;

          case "thinking_delta": {
            // Could render reasoning if model supports it
            break;
          }

          case "thinking_end":
            break;

          // --- Assessment complete (structured data) ---
          case "assessment_complete":
            if (event.result) {
              setAssessmentResult(event.result);
            }
            break;

          case "error":
            addTimelineEntry({
              id: `error-${Date.now()}`,
              type: "error",
              status: "error",
              timestamp: Date.now(),
              error: event.message ?? event.error ?? "Unknown error",
            });
            break;
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  setIsAssessing(false);
}

/** Fallback: process a plain JSON response (when SSE/Copilot CLI not available) */
async function processFallbackJSON(
  response: Response,
  subscriptionId: string,
  actions: {
    addTimelineEntry: (e: TimelineEntry) => void;
    updateTimelineEntry: (id: string, u: Partial<TimelineEntry>) => void;
    setAssessmentResult: (r: AssessmentResult) => void;
    setIsAssessing: (v: boolean) => void;
  },
) {
  const { addTimelineEntry, updateTimelineEntry, setAssessmentResult } =
    actions;
  const startTime = Date.now();

  // Show tool call entries as "in progress"
  const tools = [
    "assess_azure_resources",
    "get_budget_status",
    "query_cmdb",
    "suggest_pilot_light_plan",
  ];
  for (const tool of tools) {
    addTimelineEntry({
      id: `tool-${tool}`,
      type: "tool_call",
      status: "pending",
      timestamp: Date.now(),
      tool,
      content: TOOL_LABELS[tool],
    });
  }

  // Animate sequential execution
  for (const tool of tools) {
    updateTimelineEntry(`tool-${tool}`, {
      status: "in_progress",
      timestamp: Date.now(),
    });
    await sleep(500 + Math.random() * 600);
  }

  const result: AssessmentResult = await response.json();
  const totalDuration = Date.now() - startTime;

  // Update tool entries with results
  updateTimelineEntry("tool-assess_azure_resources", {
    status: "complete",
    toolOutput: {
      count: result.resources.resources.length,
      summary: result.resources.resource_summary,
    },
    durationMs: Math.round(totalDuration * 0.35),
  });

  updateTimelineEntry("tool-get_budget_status", {
    status: "complete",
    toolOutput: {
      spend: `$${result.budget.current_spend.toLocaleString()}`,
      budget: `$${result.budget.budget_allocated.toLocaleString()}`,
      status: result.budget.status,
    },
    durationMs: Math.round(totalDuration * 0.15),
  });

  updateTimelineEntry("tool-query_cmdb", {
    status: "complete",
    toolOutput: {
      app: result.cmdb.application_name,
      tier: result.cmdb.tier,
      rto: `${result.cmdb.rto_hours}h`,
    },
    durationMs: Math.round(totalDuration * 0.1),
  });

  updateTimelineEntry("tool-suggest_pilot_light_plan", {
    status: "complete",
    toolOutput: {
      recommendations: result.plan.recommendations.length,
      dr_cost: `$${result.plan.total_dr_monthly_cost.toLocaleString()}`,
      meets_rto: result.plan.meets_rto,
      recovery_minutes: result.plan.estimated_total_recovery_minutes,
    },
    durationMs: Math.round(totalDuration * 0.4),
  });

  // Agent summary response
  addTimelineEntry({
    id: "response-0",
    type: "response",
    status: "complete",
    timestamp: Date.now(),
    content:
      `Assessment complete for **${result.cmdb.application_name}** (${subscriptionId}).\n\n` +
      `Found **${result.resources.resources.length} resources** across ${Object.keys(result.resources.resource_summary).length} types.\n\n` +
      `Pilot Light DR plan: **$${result.plan.total_dr_monthly_cost.toLocaleString()}/mo** ` +
      `(${result.plan.cost_savings_vs_active_active}% savings vs Active-Active). ` +
      `${result.plan.meets_rto ? "✓ Meets" : "✕ Does NOT meet"} RTO of ${result.cmdb.rto_hours}h ` +
      `(est. recovery: ${result.plan.estimated_total_recovery_minutes} min).\n\n` +
      `View detailed results in the panels to the right →`,
  });

  setAssessmentResult(result);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Send a follow-up chat message via SSE */
async function runChat(
  message: string,
  actions: {
    addTimelineEntry: (e: TimelineEntry) => void;
    updateTimelineEntry: (id: string, u: Partial<TimelineEntry>) => void;
    setAssessmentResult: (r: AssessmentResult) => void;
    setIsAssessing: (v: boolean) => void;
  },
) {
  const { addTimelineEntry, setIsAssessing } = actions;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("text/event-stream")) {
      await processSSEStream(response, actions);
    } else {
      // Simple JSON response
      const data = await response.json();
      addTimelineEntry({
        id: `response-${Date.now()}`,
        type: "response",
        status: "complete",
        timestamp: Date.now(),
        content: data.response ?? JSON.stringify(data),
      });
      setIsAssessing(false);
    }
  } catch (err) {
    addTimelineEntry({
      id: `error-${Date.now()}`,
      type: "error",
      status: "error",
      timestamp: Date.now(),
      error: err instanceof Error ? err.message : "Unknown error",
    });
    setIsAssessing(false);
  }
}
