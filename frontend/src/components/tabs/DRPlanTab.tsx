import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  ArrowRight,
  FileCode2,
} from "lucide-react";
import type { AssessmentResult, PilotLightRecommendation } from "../../types";
import {
  formatCurrency,
  formatRegion,
  RESOURCE_TYPE_LABELS,
  PILOT_LIGHT_ACTION_LABELS,
  RISK_BG,
} from "../../lib/labels";

interface Props {
  data: AssessmentResult;
}

export function DRPlanTab({ data }: Props) {
  const { plan, cmdb } = data;

  // Group recommendations by resource type
  const grouped = new Map<string, PilotLightRecommendation[]>();
  for (const rec of plan.recommendations) {
    const key = rec.resource_type;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rec);
  }

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div
        className={`flex items-center justify-between rounded-lg border p-3 ${
          plan.meets_rto
            ? "border-success/30 bg-success/10"
            : "border-destructive/30 bg-destructive/10"
        }`}
      >
        <div className="flex items-center gap-2">
          {plan.meets_rto ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm font-medium">
            {plan.meets_rto
              ? `Pilot Light meets RTO of ${cmdb.rto_hours}h`
              : `Pilot Light does NOT meet RTO of ${cmdb.rto_hours}h - consider Warm Standby`}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Recovery: {plan.estimated_total_recovery_minutes} min
          </span>
          <span className="font-mono font-semibold text-foreground">
            {formatCurrency(plan.total_dr_monthly_cost)}/mo
          </span>
        </div>
      </div>

      {/* Per-type recommendation groups */}
      {Array.from(grouped.entries()).map(([type, recs]) => (
        <RecommendationGroup
          key={type}
          type={type}
          recommendations={recs}
          drRegion={cmdb.dr_region}
        />
      ))}
    </div>
  );
}

function RecommendationGroup({
  type,
  recommendations,
  drRegion,
}: {
  type: string;
  recommendations: PilotLightRecommendation[];
  drRegion: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const totalDrCost = recommendations.reduce(
    (s, r) => s + r.estimated_dr_monthly_cost,
    0,
  );
  const maxRecovery = Math.max(
    ...recommendations.map((r) => r.recovery_time_minutes),
  );
  const action = recommendations[0]?.pilot_light_action ?? "";
  const risk = recommendations[0]?.risk_level ?? "low";

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted" />
        )}
        <span className="text-sm font-semibold text-foreground">
          {RESOURCE_TYPE_LABELS[type as keyof typeof RESOURCE_TYPE_LABELS] ??
            type}
        </span>
        <span className="text-xs text-muted-foreground">
          ({recommendations.length} instance
          {recommendations.length > 1 ? "s" : ""})
        </span>

        <div className="ml-auto flex items-center gap-3">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${RISK_BG[risk]}`}
          >
            {risk}
          </span>
          <span className="text-xs text-muted-foreground">
            {PILOT_LIGHT_ACTION_LABELS[action]}
          </span>
          <span className="font-mono text-xs font-medium text-foreground">
            {formatCurrency(totalDrCost)}/mo
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Strategy description */}
          <p className="text-xs text-muted-foreground">
            {recommendations[0]?.description}
          </p>

          {/* Visual: Primary → DR */}
          <div className="flex items-center gap-3 text-xs">
            <div className="rounded border border-border bg-surface-raised px-3 py-2 text-center">
              <div className="font-medium">Primary</div>
              <div className="text-muted-foreground">
                {recommendations[0]?.current_config}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted" />
            <div className="rounded border border-primary/30 bg-primary/5 px-3 py-2 text-center">
              <div className="font-medium">DR Region</div>
              <div className="text-muted-foreground">
                {recommendations[0]?.dr_sku
                  ? `${recommendations[0].dr_sku} in ${formatRegion(drRegion)}`
                  : formatRegion(drRegion)}
              </div>
            </div>
          </div>

          {/* Instance details table */}
          {recommendations.length > 1 && (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-1 font-medium">Name</th>
                  <th className="py-1 font-medium">Current SKU</th>
                  <th className="py-1 font-medium text-right">DR Cost</th>
                  <th className="py-1 font-medium text-right">Recovery</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec) => (
                  <tr
                    key={rec.resource_name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-1 font-mono text-foreground">
                      {rec.resource_name}
                    </td>
                    <td className="py-1 text-muted-foreground">
                      {rec.current_config}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {formatCurrency(rec.estimated_dr_monthly_cost)}
                    </td>
                    <td className="py-1 text-right">
                      {rec.recovery_time_minutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pipeline ref */}
          {recommendations[0]?.pipeline_ref && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <FileCode2 className="h-3 w-3" />
              Pipeline:{" "}
              <span className="font-mono text-foreground">
                {recommendations[0].pipeline_ref}
              </span>
            </div>
          )}

          {/* Recovery + cost summary */}
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              Max recovery: {maxRecovery} min
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
