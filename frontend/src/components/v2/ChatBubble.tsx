import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import type { ChatMessage, StatusBadge, TableData, ThinkingStep } from "../../store/chat";
import { RpoSlider } from "./RpoSlider";

interface Props {
  message: ChatMessage;
  stageColor: string;
}

export function ChatBubble({ message }: Props) {
  if (message.role === "user") {
    return <UserBubble message={message} />;
  }
  return <AgentBubble message={message} />;
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="bg-foreground text-surface rounded-2xl rounded-br-md px-4 py-2.5 max-w-[65%]">
        <p className="text-[13px] leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

function AgentBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex gap-3 max-w-full">
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
            <polyline points="7.5 19.79 7.5 14.6 3 12" />
            <polyline points="21 12 16.5 14.6 16.5 19.79" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Thinking log (collapsible, shown after completion) */}
        {message.thinkingLog && message.thinkingLog.length > 0 && (
          <ThinkingLog steps={message.thinkingLog} />
        )}

        {/* Badges */}
        {message.badges && message.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.badges.map((badge, i) => (
              <BadgePill key={i} badge={badge} />
            ))}
          </div>
        )}

        {/* Text */}
        {message.content && (
          <div className="text-[13px] leading-[1.7] text-foreground">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                ul: ({ children }) => <ul className="space-y-1 mb-2">{children}</ul>,
                li: ({ children }) => (
                  <li className="flex gap-2 text-[13px]">
                    <span className="text-muted mt-0.5">›</span>
                    <span>{children}</span>
                  </li>
                ),
                a: ({ children, href }) => (
                  <a href={href} className="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent/60 v2-transition">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tables */}
        {message.tables && message.tables.length > 0 && (
          <div className="space-y-3">
            {message.tables.map((table, i) => (
              <DataTable key={i} table={table} />
            ))}
          </div>
        )}

        {/* Interactive widget */}
        {message.widget && message.widget.type === "rpo-slider" && (
          <RpoSlider config={message.widget.config} />
        )}

        {/* Streaming */}
        {message.isStreaming && (
          <div className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
}

const BADGE_VARIANT = {
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning border-warning/20",
  error: "bg-destructive-muted text-destructive border-destructive/20",
  info: "bg-accent/10 text-accent border-accent/20",
  neutral: "bg-surface-raised text-muted-foreground border-border",
} as const;

const BADGE_ICON = {
  success: "✓",
  warning: "!",
  error: "×",
  info: "i",
  neutral: "",
} as const;

function BadgePill({ badge }: { badge: StatusBadge }) {
  const variant = BADGE_VARIANT[badge.variant] ?? BADGE_VARIANT.neutral;
  const icon = BADGE_ICON[badge.variant] ?? "";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${variant}`}>
      {icon && <span className="font-mono text-[10px]">{icon}</span>}
      {badge.label}
    </span>
  );
}

const TABLE_HEADER = {
  default: "bg-surface-raised text-muted-foreground",
  danger: "bg-destructive text-white",
  success: "bg-success text-white",
} as const;

const ROW_VALUE = {
  success: "text-success font-medium",
  warning: "text-warning font-medium",
  error: "text-destructive font-medium",
  neutral: "text-foreground font-mono",
} as const;

function DataTable({ table }: { table: TableData }) {
  const headerCls = TABLE_HEADER[table.variant ?? "default"];

  return (
    <div className="v2-card overflow-hidden">
      <div className={`px-3 py-2 text-[11px] font-semibold tracking-wide uppercase ${headerCls}`}>
        {table.title}
      </div>
      <div className="divide-y divide-border">
        {table.rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 text-[13px]">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={ROW_VALUE[row.variant ?? "neutral"]}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Collapsible thinking log ---

function ThinkingLog({ steps }: { steps: ThinkingStep[] }) {
  const [expanded, setExpanded] = useState(false);
  const totalMs = steps.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
  const totalSec = (totalMs / 1000).toFixed(1);

  return (
    <div className="v2-card !rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left v2-transition hover:bg-surface-raised"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        <span className="text-[12px] font-medium text-foreground">
          {steps.length} steps completed
        </span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted">
          <Clock className="h-3 w-3" />
          {totalSec}s
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-1.5">
          {steps.map((step) => (
            <ThinkingLogStep key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingLogStep({ step }: { step: ThinkingStep }) {
  const [open, setOpen] = useState(false);
  const hasSubs = step.subSteps && step.subSteps.length > 0;
  const dur = step.durationMs ? `${(step.durationMs / 1000).toFixed(1)}s` : "";

  return (
    <div>
      <button
        onClick={() => hasSubs && setOpen(!open)}
        className={`flex items-center gap-2 w-full text-left py-0.5 ${hasSubs ? "cursor-pointer" : "cursor-default"}`}
      >
        {hasSubs && (
          open ? (
            <ChevronDown className="h-3 w-3 text-muted" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted" />
          )
        )}
        {!hasSubs && <span className="w-3" />}
        <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-success" />
        <span className="text-[11px] text-muted-foreground flex-1 truncate">{step.label}</span>
        {step.detail && (
          <span className="text-[10px] text-muted ml-1 flex-shrink-0">{step.detail}</span>
        )}
        {dur && (
          <span className="text-[10px] text-muted font-mono flex-shrink-0">{dur}</span>
        )}
      </button>
      {open && hasSubs && (
        <div className="ml-8 mt-0.5 space-y-0.5 pb-1">
          {step.subSteps!.map((sub, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted font-mono">
              <span className="text-muted-foreground mt-px">›</span>
              <span>{sub}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
