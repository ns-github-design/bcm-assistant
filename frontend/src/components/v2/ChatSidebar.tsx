import {
  Plus,
  CheckCircle2,
  Circle,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore, STAGES } from "../../store/chat";

export function ChatSidebar() {
  const navigate = useNavigate();
  const {
    activeStage,
    completedStages,
    sessions,
    activeSessionId,
    serviceContext,
    userName,
    userRole,
    createSession,
    startDemo,
    setActiveSession,
    setActiveStage,
  } = useChatStore();

  const handleNewConversation = () => {
    const id = startDemo();
    navigate(`/c/${id}`);
  };

  const handleSessionClick = (sessionId: string) => {
    setActiveSession(sessionId);
    navigate(`/c/${sessionId}`);
  };

  return (
    <aside className="flex w-[256px] flex-shrink-0 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <button onClick={() => navigate("/")} className="flex items-center gap-3 px-5 py-4 w-full text-left hover:bg-surface-raised/50 v2-transition">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
          <Shield className="h-4 w-4 text-surface" />
        </div>
        <div>
          <div className="text-[13px] font-semibold tracking-tight text-foreground leading-none">
            BCM Copilot
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Pilot Light Assistant</div>
        </div>
      </button>

      {/* New conversation */}
      <div className="px-3 pb-3">
        <button
          onClick={handleNewConversation}
          className="flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-[12px] text-muted-foreground v2-transition hover:bg-surface-raised hover:text-foreground hover:border-border-emphasis"
        >
          <Plus className="h-3.5 w-3.5" />
          New conversation
        </button>
      </div>

      {/* Session list */}
      {sessions.length > 0 && (
        <div className="px-3 pb-1">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2 px-2">
            Recent
          </div>
          <div className="space-y-0.5">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] v2-transition ${
                  session.id === activeSessionId
                    ? "bg-surface-raised text-foreground font-medium"
                    : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                  session.id === activeSessionId ? "bg-accent" : "bg-border-emphasis"
                }`} />
                <span className="truncate">{session.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-3 border-t border-border" />

      {/* Workflow stages */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
        <div className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2 px-2">
          Workflow
        </div>
        <nav className="space-y-0.5">
          {STAGES.map((stage) => {
            const isCompleted = completedStages.includes(stage.id);
            const isActive = activeStage === stage.id;
            const isDisabled = stage.disabled && !isCompleted;

            return (
              <button
                key={stage.id}
                onClick={() => !isDisabled && setActiveStage(stage.id)}
                disabled={isDisabled}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left v2-transition ${
                  isDisabled
                    ? "opacity-40 cursor-not-allowed"
                    : isActive
                      ? "bg-surface-raised"
                      : "hover:bg-surface-raised/50"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                ) : isActive ? (
                  <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                    {stage.id}
                  </div>
                ) : (
                  <Circle className="h-4 w-4 flex-shrink-0 text-muted" />
                )}
                <span
                  className={`text-[12px] ${
                    isCompleted
                      ? "text-foreground"
                      : isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Service card */}
      {serviceContext && (
        <div className="mx-3 mb-2">
          <div className="v2-card p-3">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted mb-1.5">
              Service
            </div>
            <div className="text-[13px] font-semibold text-foreground">{serviceContext.name}</div>
            {serviceContext.tier && (
              <div className="mt-1.5 flex gap-2 text-[10px] text-muted-foreground">
                <span className="rounded bg-surface-raised px-1.5 py-0.5">{serviceContext.tier}</span>
                {serviceContext.rto && <span className="rounded bg-surface-raised px-1.5 py-0.5">RTO {serviceContext.rto}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent">
            {userName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-foreground truncate">{userName}</div>
            <div className="text-[10px] text-muted-foreground">{userRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
