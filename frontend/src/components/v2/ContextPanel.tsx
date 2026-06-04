import { useChatStore, STAGES } from "../../store/chat";
import type { SummaryRow } from "../../store/chat";

export function ContextPanel() {
  const { activeStage, stageContextMap, serviceContext } = useChatStore();
  const stage = STAGES[activeStage - 1];
  const contextSummary = stageContextMap[activeStage] ?? [];

  if (!stage) return null;

  return (
    <aside className="flex w-[300px] flex-shrink-0 flex-col border-l border-border bg-surface overflow-y-auto">
      {/* Stage header */}
      <div className="px-5 pt-5 pb-4">
        <div className="text-[10px] font-medium uppercase tracking-widest text-muted mb-1">
          Stage {stage.id} of {STAGES.length}
        </div>
        <h2 className="text-base font-semibold text-foreground">{stage.label}</h2>
      </div>

      <div className="mx-5 border-t border-border" />

      {/* Goal */}
      <div className="px-5 py-4">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Goal</div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {stage.goal}
        </p>
      </div>

      <div className="mx-5 border-t border-border" />

      {/* Steps */}
      <div className="px-5 py-4">
        <div className="space-y-3">
          {stage.steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-accent/10 text-[11px] font-semibold text-accent">
                {i + 1}
              </div>
              <div className="pt-0.5">
                <div className="text-[13px] font-medium text-foreground leading-snug">
                  {step}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary data */}
      {contextSummary.length > 0 && (
        <>
          <div className="mx-5 border-t border-border" />
          <div className="px-5 py-4">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Summary
            </div>
            <div className="v2-card overflow-hidden">
              <div className="divide-y divide-border">
                {contextSummary.map((row, i) => (
                  <SummaryRowItem key={i} row={row} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Budget bar */}
      {serviceContext?.budgetUtilisation != null && (
        <>
          <div className="mx-5 border-t border-border" />
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">Budget utilisation</span>
              <span className={`text-[11px] font-semibold font-mono ${
                serviceContext.budgetUtilisation > 100 ? "text-destructive" : "text-success"
              }`}>
                {serviceContext.budgetUtilisation}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-inset overflow-hidden">
              <div
                className={`h-full rounded-full v2-transition ${
                  serviceContext.budgetUtilisation > 100
                    ? "bg-destructive"
                    : serviceContext.budgetUtilisation > 80
                      ? "bg-warning"
                      : "bg-success"
                }`}
                style={{ width: `${Math.min(serviceContext.budgetUtilisation, 100)}%` }}
              />
            </div>
            {serviceContext.budgetUtilisation > 100 && (
              <div className="mt-2.5 v2-card !rounded-lg px-3 py-2 text-[11px] text-success font-medium text-center bg-success-muted border-success/20">
                Pilot Light: {Math.round(serviceContext.budgetUtilisation * 0.54)}% of budget
              </div>
            )}
          </div>
        </>
      )}

      {/* Sources */}
      <div className="mt-auto px-5 py-3 border-t border-border">
        <div className="text-[10px] text-muted text-center">
          {stage.sources.join(" · ")}
        </div>
      </div>
    </aside>
  );
}

const VALUE_STYLES = {
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  neutral: "text-foreground",
} as const;

function SummaryRowItem({ row }: { row: SummaryRow }) {
  const cls = VALUE_STYLES[row.variant ?? "neutral"];
  return (
    <div className="flex items-center justify-between px-3 py-2.5 text-[13px]">
      <span className="text-muted-foreground">{row.label}</span>
      <span className={`font-medium font-mono text-[12px] ${cls}`}>{row.value}</span>
    </div>
  );
}
