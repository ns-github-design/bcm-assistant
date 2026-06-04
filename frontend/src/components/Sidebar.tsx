import {
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
} from "lucide-react";
import { useAssessmentStore } from "../store/assessment";

interface Props {
  activeView: "chat" | "results";
  onViewChange: (view: "chat" | "results") => void;
  hasResults: boolean;
}

export function Sidebar({ activeView, onViewChange, hasResults }: Props) {
  const { assessmentResult, isAssessing, subscriptionId } =
    useAssessmentStore();
  const cmdb = assessmentResult?.cmdb;

  return (
    <aside className="flex w-[240px] flex-shrink-0 flex-col border-r border-border bg-surface">
      {/* New conversation button */}
      <div className="p-3">
        <button
          onClick={() => window.location.reload()}
          className="flex h-9 w-full items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-border-emphasis"
        >
          <Plus className="h-3.5 w-3.5" />
          New assessment
        </button>
      </div>

      {/* Current session */}
      <div className="px-3 pb-2">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
          Current
        </div>
        <div className="mt-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-2">
          <div className="flex items-center gap-2">
            {isAssessing ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : hasResults ? (
              <CheckCircle2 className="h-3 w-3 text-success" />
            ) : (
              <Circle className="h-3 w-3 text-muted" />
            )}
            <span className="text-xs font-medium text-foreground truncate">
              {cmdb?.application_name ?? subscriptionId ?? "Assessment"}
            </span>
          </div>
          {cmdb && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              Tier {cmdb.tier} · {cmdb.primary_region}
            </div>
          )}
        </div>
      </div>

      {/* Guided workflow */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2">
          Workflow
        </div>
        <nav className="space-y-0.5">
          <WorkflowStep
            number={1}
            label="Resource Discovery"
            status={
              hasResults ? "complete" : isAssessing ? "active" : "pending"
            }
          />
          <WorkflowStep
            number={2}
            label="Budget & FinOps"
            status={
              hasResults ? "complete" : isAssessing ? "active" : "pending"
            }
          />
          <WorkflowStep
            number={3}
            label="CMDB & Tier"
            status={
              hasResults ? "complete" : isAssessing ? "active" : "pending"
            }
          />
          <WorkflowStep
            number={4}
            label="DR Plan Generation"
            status={hasResults ? "complete" : "pending"}
          />
          <WorkflowStep
            number={5}
            label="Review & Validate"
            status={hasResults ? "active" : "pending"}
          />
        </nav>

        {/* Quick nav */}
        {hasResults && (
          <div className="mt-6">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted mb-2">
              Views
            </div>
            <nav className="space-y-0.5">
              <NavButton
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                label="Copilot Chat"
                active={activeView === "chat"}
                onClick={() => onViewChange("chat")}
              />
              <NavButton
                icon={<BarChart3 className="h-3.5 w-3.5" />}
                label="Assessment Results"
                active={activeView === "results"}
                onClick={() => onViewChange("results")}
              />
            </nav>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
            U
          </div>
          <div className="text-xs">
            <div className="font-medium text-foreground">User</div>
            <div className="text-[10px] text-muted-foreground">BCM Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function WorkflowStep({
  number,
  label,
  status,
}: {
  number: number;
  label: string;
  status: "pending" | "active" | "complete";
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
      {status === "complete" ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
      ) : status === "active" ? (
        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
          {number}
        </div>
      ) : (
        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-border text-[9px] text-muted">
          {number}
        </div>
      )}
      <span
        className={`text-xs ${
          status === "complete"
            ? "text-foreground"
            : status === "active"
              ? "text-foreground font-medium"
              : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
        active
          ? "bg-primary/10 text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
