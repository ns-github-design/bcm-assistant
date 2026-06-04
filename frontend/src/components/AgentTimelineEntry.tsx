import { useState } from "react";
import {
  User,
  Wrench,
  Brain,
  Bot,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { TimelineEntry } from "../types";

interface Props {
  entry: TimelineEntry;
}

/**
 * A single entry in the Agent Activity Feed timeline.
 * Collapsible, with icon/color matching the event type.
 */
export function AgentTimelineEntry({ entry }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group relative flex gap-3 py-1.5">
      {/* Timeline connector line */}
      <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border group-last:hidden" />

      {/* Icon */}
      <div className="relative z-10 mt-0.5 flex-shrink-0">{getIcon(entry)}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {entry.type === "user" && <UserEntry content={entry.content ?? ""} />}
        {entry.type === "tool_call" && (
          <ToolCallEntry
            entry={entry}
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
          />
        )}
        {entry.type === "thinking" && (
          <ThinkingEntry content={entry.content ?? ""} />
        )}
        {entry.type === "response" && (
          <ResponseEntry content={entry.content ?? ""} />
        )}
        {entry.type === "error" && (
          <ErrorEntry error={entry.error ?? "Unknown error"} />
        )}
      </div>
    </div>
  );
}

function getIcon(entry: TimelineEntry) {
  const base =
    "h-[22px] w-[22px] rounded-full flex items-center justify-center";

  switch (entry.type) {
    case "user":
      return (
        <div className={`${base} bg-surface-raised`}>
          <User className="h-3 w-3 text-foreground" />
        </div>
      );
    case "tool_call":
      if (entry.status === "in_progress") {
        return (
          <div className={`${base} bg-agent-tool/20`}>
            <Loader2 className="h-3 w-3 animate-spin text-agent-tool" />
          </div>
        );
      }
      if (entry.status === "complete") {
        return (
          <div className={`${base} bg-agent-complete/20`}>
            <CheckCircle2 className="h-3 w-3 text-agent-complete" />
          </div>
        );
      }
      if (entry.status === "error") {
        return (
          <div className={`${base} bg-destructive/20`}>
            <AlertCircle className="h-3 w-3 text-destructive" />
          </div>
        );
      }
      return (
        <div className={`${base} bg-surface-raised`}>
          <Circle className="h-3 w-3 text-agent-pending" />
        </div>
      );
    case "thinking":
      return (
        <div className={`${base} bg-agent-thinking/20`}>
          <Brain className="h-3 w-3 text-agent-thinking" />
        </div>
      );
    case "response":
      return (
        <div className={`${base} bg-agent-complete/20`}>
          <Bot className="h-3 w-3 text-agent-complete" />
        </div>
      );
    case "error":
      return (
        <div className={`${base} bg-destructive/20`}>
          <AlertCircle className="h-3 w-3 text-destructive" />
        </div>
      );
  }
}

function UserEntry({ content }: { content: string }) {
  return <p className="text-sm text-foreground">{content}</p>;
}

function ToolCallEntry({
  entry,
  expanded,
  onToggle,
}: {
  entry: TimelineEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasProgress =
    entry.progressMessages && entry.progressMessages.length > 0;
  const isExpandable =
    hasProgress || (entry.status === "complete" && entry.toolOutput);
  const lastProgress = hasProgress
    ? entry.progressMessages![entry.progressMessages!.length - 1]
    : null;

  return (
    <div>
      <button
        onClick={onToggle}
        disabled={!isExpandable}
        className="flex w-full items-center gap-1.5 text-left text-xs disabled:cursor-default"
      >
        {isExpandable ? (
          expanded ? (
            <ChevronDown className="h-3 w-3 text-muted" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted" />
          )
        ) : (
          <span className="w-3" />
        )}

        <Wrench className="h-3 w-3 text-agent-tool" />
        <span className="font-medium text-foreground">{entry.content}</span>

        {entry.status === "in_progress" && (
          <span className="ml-auto text-agent-tool">running...</span>
        )}
        {entry.status === "complete" && entry.durationMs != null && (
          <span className="ml-auto flex items-center gap-1 text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {(entry.durationMs / 1000).toFixed(1)}s
          </span>
        )}
      </button>

      {/* Current sub-step (shown inline when not expanded) */}
      {!expanded && entry.status === "in_progress" && lastProgress && (
        <div className="ml-[18px] mt-0.5 text-[11px] text-muted-foreground truncate">
          {lastProgress}
        </div>
      )}

      {/* Expanded: show all sub-steps */}
      {expanded && hasProgress && (
        <div className="mt-1 ml-[18px] space-y-0.5">
          {entry.progressMessages!.map((msg, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground/40" />
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* Expanded: show raw output if available */}
      {expanded && entry.status === "complete" && entry.toolOutput && (
        <div className="mt-1.5 ml-[18px] rounded border border-border bg-surface p-2">
          <pre className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(entry.toolOutput, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ThinkingEntry({ content }: { content: string }) {
  return <p className="text-xs italic text-agent-thinking">{content}</p>;
}

function ResponseEntry({ content }: { content: string }) {
  // Simple markdown-ish rendering (bold only for now)
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="text-sm leading-relaxed text-foreground">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}

function ErrorEntry({ error }: { error: string }) {
  return (
    <div className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2">
      <p className="text-xs text-destructive">{error}</p>
    </div>
  );
}
