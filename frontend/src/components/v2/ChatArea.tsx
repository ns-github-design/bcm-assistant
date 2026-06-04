import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Zap, MessageSquare, CheckCircle2, Loader2, Circle, Search, Database, DollarSign, Shield, FileText } from "lucide-react";
import { useChatStore, STAGES } from "../../store/chat";
import type { SuggestedPrompt, ThinkingStep } from "../../store/chat";
import { ChatBubble } from "./ChatBubble";

export function ChatArea() {
  const {
    messages, isAgentTyping, activeStage, sendMessage, activeSessionId,
    isDemoMode, demoInputSuggestion, demoInlineSuggestions, advanceDemo,
    thinkingSteps,
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const stage = STAGES[activeStage - 1];
  const stageColor = stage?.color ?? "orange";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping, demoInputSuggestion, demoInlineSuggestions, thinkingSteps]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || isAgentTyping) return;

    if (isDemoMode) {
      advanceDemo(input.value.trim());
    } else {
      sendMessage(input.value.trim());
    }
    input.value = "";
    input.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 120) + "px";
  };

  const handleSuggestion = (prompt: SuggestedPrompt) => {
    if (isAgentTyping) return;
    if (isDemoMode) {
      advanceDemo(prompt.message);
    } else {
      sendMessage(prompt.message);
    }
  };

  // Show stage suggestions when not in demo mode and conversation is early
  const showStageSuggestions = stage && !isAgentTyping && !isDemoMode && messages.length > 0 && messages.length < 4;

  return (
    <div className="flex flex-1 flex-col bg-background overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
          {/* Empty state */}
          {messages.length === 0 && !activeSessionId && (
            <EmptyState />
          )}

          {/* Welcome (non-demo sessions only) */}
          {messages.length === 0 && activeSessionId && !isDemoMode && stage && (
            <WelcomeMessage stage={stage} onSuggestion={handleSuggestion} />
          )}

          {/* Timestamp divider */}
          {messages.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-medium text-muted tracking-wide uppercase">
                {stage ? `Stage ${stage.id} · ${stage.label}` : "Conversation"}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} stageColor={stageColor} />
          ))}

          {/* Demo inline follow-up suggestions */}
          {isDemoMode && !isAgentTyping && demoInlineSuggestions.length > 0 && (
            <div className="pl-10 space-y-2">
              <div className="text-[11px] font-medium text-muted uppercase tracking-wide">
                Follow-up options
              </div>
              <div className="flex flex-wrap gap-2">
                {demoInlineSuggestions.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(prompt)}
                    className="v2-card !rounded-lg px-3 py-2 text-left v2-transition hover:border-border-emphasis hover:shadow-sm group"
                  >
                    <div className="text-[12px] font-medium text-foreground group-hover:text-accent v2-transition">
                      {prompt.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thinking steps */}
          {isAgentTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-accent animate-pulse" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {thinkingSteps.length > 0 ? (
                  <div className="v2-card !rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                      <Loader2 className="h-3.5 w-3.5 text-accent animate-spin" />
                      <span className="text-[12px] font-medium text-foreground">
                        {thinkingSteps.filter((s) => s.status === "done").length} of {thinkingSteps.length} steps completed
                      </span>
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      {thinkingSteps.map((step) => (
                        <ThinkingStepRow key={step.id} step={step} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 py-1.5">
                    <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                    <span className="text-[12px] text-muted-foreground">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Stage suggested prompts - above input (non-demo mode) */}
      {showStageSuggestions && (
        <div className="px-6">
          <div className="max-w-2xl mx-auto flex flex-wrap gap-1.5 pb-2">
            {stage!.suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(prompt)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] text-muted-foreground v2-transition hover:bg-surface-raised hover:text-foreground hover:border-border-emphasis"
              >
                <MessageSquare className="h-3 w-3" />
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Demo prefill suggestion - single button above input */}
      {isDemoMode && !isAgentTyping && demoInputSuggestion && (
        <div className="px-6">
          <div className="max-w-2xl mx-auto pb-2">
            <button
              onClick={() => handleSuggestion(demoInputSuggestion)}
              className="w-full v2-card !rounded-xl px-4 py-3 text-left v2-transition hover:border-accent/30 hover:shadow-md group flex items-center gap-3"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 v2-transition">
                <ArrowUp className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">
                  {demoInputSuggestion.message}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Click to send - or type your own
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-5 pt-2">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative v2-card !rounded-xl overflow-hidden focus-within:!border-accent/40 v2-transition">
            <textarea
              ref={inputRef}
              rows={1}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={isAgentTyping ? "Analysing..." : "Message BCM Copilot..."}
              disabled={isAgentTyping}
              className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-[13px] text-foreground placeholder:text-muted focus:outline-none disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={isAgentTyping}
              className="absolute right-2.5 bottom-2 flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-surface v2-transition hover:opacity-80 disabled:opacity-20"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] text-muted">
            Powered by GitHub Copilot · Pilot Light BCM patterns
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState() {
  const { startDemo } = useChatStore();
  const navigate = useNavigate();

  const handleDemo = () => {
    const id = startDemo();
    navigate(`/c/${id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
        <svg className="h-7 w-7 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">
        BCM Copilot
      </h2>
      <p className="text-[13px] text-muted-foreground mb-8 max-w-sm leading-relaxed">
        Analyse your Azure services, set up Pilot Light DR, and navigate BCM compliance - guided step by step.
      </p>
      <div className="flex gap-3 w-full max-w-sm">
        <div
          className="flex-1 v2-card !rounded-xl px-4 py-3 text-left opacity-50 cursor-not-allowed"
        >
          <div className="text-[13px] font-medium text-foreground">Start assessment</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Coming soon</div>
        </div>
        <button
          onClick={handleDemo}
          className="flex-1 v2-card !rounded-xl px-4 py-3 text-left v2-transition hover:border-border-emphasis hover:shadow-md"
        >
          <div className="text-[13px] font-medium text-foreground">Demo mode</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Research API mock</div>
        </button>
      </div>
    </div>
  );
}

function WelcomeMessage({ stage, onSuggestion }: { stage: typeof STAGES[number]; onSuggestion: (p: SuggestedPrompt) => void }) {
  return (
    <div className="space-y-5">
      {/* Agent welcome */}
      <div className="flex gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <svg className="h-3.5 w-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-[13px] font-semibold text-foreground">
            Stage {stage.id}: {stage.label}
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {stage.welcomeMessage}
          </p>
        </div>
      </div>

      {/* Suggested prompts */}
      <div className="pl-10">
        <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">
          Try asking
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stage.suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onSuggestion(prompt)}
              className="v2-card !rounded-lg px-3 py-2.5 text-left v2-transition hover:border-border-emphasis hover:shadow-sm group"
            >
              <div className="text-[12px] font-medium text-foreground group-hover:text-accent v2-transition">
                {prompt.label}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                {prompt.message}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Thinking step icons ---
const STEP_ICONS: Record<string, React.ReactNode> = {
  // Stage 1: Analysis
  t1: <Shield className="h-3 w-3" />,
  t2: <Search className="h-3 w-3" />,
  "t-discover": <Database className="h-3 w-3" />,
  t3: <Database className="h-3 w-3" />,
  t4: <Database className="h-3 w-3" />,
  t5: <Database className="h-3 w-3" />,
  t6: <DollarSign className="h-3 w-3" />,
  t7: <DollarSign className="h-3 w-3" />,
  t8: <Zap className="h-3 w-3" />,
  t9: <FileText className="h-3 w-3" />,
  f1: <Database className="h-3 w-3" />,
  f2: <DollarSign className="h-3 w-3" />,
  f3: <Shield className="h-3 w-3" />,
  f4: <Search className="h-3 w-3" />,
  f5: <FileText className="h-3 w-3" />,
  // Stage 2: RTO & RPO
  "s2-t1": <Search className="h-3 w-3" />,
  "s2-t2": <Shield className="h-3 w-3" />,
  "s2-t3": <Zap className="h-3 w-3" />,
  "s2-t4": <FileText className="h-3 w-3" />,
  "s2-t5": <Shield className="h-3 w-3" />,
  "s2-t6": <Search className="h-3 w-3" />,
  "s2-r1": <Shield className="h-3 w-3" />,
  "s2-r2": <Zap className="h-3 w-3" />,
  "s2-r3": <DollarSign className="h-3 w-3" />,
  // Stage 3: Adopt Pilot Light
  "s3-t1": <Search className="h-3 w-3" />,
  "s3-t2": <Database className="h-3 w-3" />,
  "s3-t3": <Shield className="h-3 w-3" />,
  "s3-t4": <FileText className="h-3 w-3" />,
  "s3-t5": <Zap className="h-3 w-3" />,
  "s3-a1": <Database className="h-3 w-3" />,
  "s3-a2": <FileText className="h-3 w-3" />,
  "s3-a3": <Shield className="h-3 w-3" />,
  "s3-a4": <Zap className="h-3 w-3" />,
  "s3-a5": <Shield className="h-3 w-3" />,
};

function ThinkingStepRow({ step }: { step: ThinkingStep }) {
  const isDone = step.status === "done";
  const isPending = step.status === "pending";
  const isActive = step.status === "active";
  const icon = STEP_ICONS[step.id];
  const hasSubs = step.subSteps && step.subSteps.length > 0;
  const showSubs = hasSubs && (isActive || (isDone && step.expanded));

  return (
    <div className={isPending ? "opacity-40" : ""}>
      <div className="flex items-center gap-2 py-0.5">
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-success" />
        ) : isActive ? (
          <Loader2 className="h-3.5 w-3.5 flex-shrink-0 text-accent animate-spin" />
        ) : (
          <Circle className="h-3.5 w-3.5 flex-shrink-0 text-muted" />
        )}
        <span className={`flex items-center gap-1.5 text-[12px] ${
          isDone ? "text-muted-foreground" : isActive ? "text-foreground font-medium" : "text-muted"
        }`}>
          {icon && <span className={isActive ? "text-accent" : "text-muted"}>{icon}</span>}
          {step.label}
        </span>
        {step.detail && isDone && (
          <span className="text-[11px] text-muted ml-auto">{step.detail}</span>
        )}
        {step.durationMs && isDone && (
          <span className="text-[10px] text-muted font-mono ml-1">{(step.durationMs / 1000).toFixed(1)}s</span>
        )}
      </div>
      {showSubs && (
        <div className="ml-6 mt-0.5 space-y-0.5">
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
