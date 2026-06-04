import type { AssessmentResult } from "../../types";
import { formatCurrency, RESOURCE_TYPE_SHORT } from "../../lib/labels";

interface Props {
  data: AssessmentResult;
}

export function CostExplorerTab({ data }: Props) {
  const { resources, plan } = data;

  const currentCost = resources.total_monthly_cost;
  const pilotLightCost = plan.total_dr_monthly_cost;
  const activeActiveCost = Math.round(currentCost * 0.95);

  const scenarios = [
    {
      name: "Current",
      monthly: currentCost,
      annual: currentCost * 12,
      savings: 0,
      rto: "N/A",
    },
    {
      name: "Pilot Light",
      monthly: pilotLightCost,
      annual: pilotLightCost * 12,
      savings: Math.round(
        ((activeActiveCost - pilotLightCost) / activeActiveCost) * 100,
      ),
      rto: `~${plan.estimated_total_recovery_minutes} min`,
    },
    {
      name: "Active-Active",
      monthly: activeActiveCost,
      annual: activeActiveCost * 12,
      savings: Math.round(
        ((currentCost - activeActiveCost) / currentCost) * 100,
      ),
      rto: "~5 min",
    },
  ];

  // Per-type cost breakdown
  const typeBreakdown = Object.entries(resources.resource_summary)
    .map(([type, count]) => {
      const typeResources = resources.resources.filter((r) => r.type === type);
      const typeCost = typeResources.reduce(
        (s, r) => s + r.estimated_monthly_cost,
        0,
      );
      const drCost = plan.recommendations
        .filter((r) => r.resource_type === type)
        .reduce((s, r) => s + r.estimated_dr_monthly_cost, 0);
      return { type, count, currentCost: typeCost, drCost };
    })
    .sort((a, b) => b.drCost - a.drCost);

  const maxCost = Math.max(...typeBreakdown.map((t) => t.currentCost));

  return (
    <div className="space-y-6">
      {/* Scenario comparison */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-2">
          <h3 className="text-sm font-semibold">Scenario Comparison</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium" />
              {scenarios.map((s) => (
                <th
                  key={s.name}
                  className={`px-4 py-2 text-right font-medium ${s.name === "Pilot Light" ? "text-success" : ""}`}
                >
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-2 text-muted-foreground">Monthly</td>
              {scenarios.map((s) => (
                <td
                  key={s.name}
                  className={`px-4 py-2 text-right font-mono font-semibold ${s.name === "Pilot Light" ? "text-success" : ""}`}
                >
                  {formatCurrency(s.monthly)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2 text-muted-foreground">Annual</td>
              {scenarios.map((s) => (
                <td key={s.name} className="px-4 py-2 text-right font-mono">
                  {formatCurrency(s.annual)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border">
              <td className="px-4 py-2 text-muted-foreground">
                Savings vs Active-Active
              </td>
              {scenarios.map((s) => (
                <td
                  key={s.name}
                  className={`px-4 py-2 text-right font-mono ${s.savings > 50 ? "text-success" : ""}`}
                >
                  {s.savings > 0 ? `${s.savings}%` : "-"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2 text-muted-foreground">RTO</td>
              {scenarios.map((s) => (
                <td key={s.name} className="px-4 py-2 text-right font-mono">
                  {s.rto}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-service cost breakdown */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-2">
          <h3 className="text-sm font-semibold">Per-Service Cost Breakdown</h3>
        </div>
        <div className="space-y-2 p-4">
          {typeBreakdown.map((item) => (
            <div key={item.type} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  {RESOURCE_TYPE_SHORT[
                    item.type as keyof typeof RESOURCE_TYPE_SHORT
                  ] ?? item.type}
                </span>
                <span className="font-mono text-muted-foreground">
                  {formatCurrency(item.drCost)}{" "}
                  <span className="text-muted">
                    / {formatCurrency(item.currentCost)}
                  </span>
                </span>
              </div>
              <div className="flex h-2 w-full gap-0.5">
                <div
                  className="h-2 rounded-l bg-muted-foreground/30"
                  style={{ width: `${(item.currentCost / maxCost) * 100}%` }}
                />
                <div
                  className="h-2 rounded-r bg-success"
                  style={{ width: `${(item.drCost / maxCost) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded bg-muted-foreground/30" />{" "}
              Current
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded bg-success" /> DR
              (Pilot Light)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
