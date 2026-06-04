import {
  Server,
  Database,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { AssessmentResult } from "../../types";
import {
  formatCurrency,
  formatRegion,
  RESOURCE_TYPE_SHORT,
  TIER_COLORS,
  BUDGET_STATUS_COLORS,
  PILOT_LIGHT_ACTION_LABELS,
} from "../../lib/labels";

interface Props {
  data: AssessmentResult;
}

export function OverviewTab({ data }: Props) {
  const { resources, budget, cmdb, plan } = data;
  const meetsRto = plan.meets_rto;

  return (
    <div className="space-y-6">
      {/* Top stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Server className="h-5 w-5 text-primary" />}
          label="Resources Discovered"
          value={String(resources.resources.length)}
          sub={`${Object.keys(resources.resource_summary).length} resource types`}
        />
        <StatCard
          icon={<Database className="h-5 w-5 text-primary" />}
          label={cmdb.application_name}
          value={
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm font-semibold ${TIER_COLORS[cmdb.tier]}`}
            >
              Tier {cmdb.tier}
            </span>
          }
          sub={`RTO: ${cmdb.rto_hours}h · RPO: ${cmdb.rpo_hours}h · Owner: ${cmdb.owner}`}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          label="Monthly Spend"
          value={formatCurrency(budget.current_spend)}
          sub={
            <span className={BUDGET_STATUS_COLORS[budget.status]}>
              {budget.status === "under"
                ? "Under budget"
                : budget.status === "at_risk"
                  ? "⚠ At risk"
                  : "✕ Over budget"}
              {" · "}Budget: {formatCurrency(budget.budget_allocated)}
            </span>
          }
        />
      </div>

      {/* DR Readiness */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Pilot Light DR Readiness</h3>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${meetsRto ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
          >
            {meetsRto ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {meetsRto ? "Meets" : "Does NOT meet"} RTO of {cmdb.rto_hours}h
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="rounded-lg bg-background p-4">
            <div className="font-mono text-2xl font-bold text-foreground">
              {formatCurrency(plan.total_dr_monthly_cost)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">DR Cost</div>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="font-mono text-2xl font-bold text-success">
              {plan.cost_savings_vs_active_active}%
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Savings vs Active-Active
            </div>
          </div>
          <div className="rounded-lg bg-background p-4">
            <div className="font-mono text-2xl font-bold text-foreground">
              {plan.estimated_total_recovery_minutes}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                min
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Est. Recovery
            </div>
          </div>
        </div>

        {/* Savings bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>DR cost</span>
            <span>Current spend</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-surface-raised">
            <div
              className="h-2 rounded-full bg-success"
              style={{
                width: `${Math.min(100, (plan.total_dr_monthly_cost / resources.total_monthly_cost) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Resource breakdown table */}
      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold">Resource Breakdown</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium text-right">Count</th>
              <th className="px-6 py-3 font-medium text-right">Cost/mo</th>
              <th className="px-6 py-3 font-medium">DR Strategy</th>
              <th className="px-6 py-3 font-medium text-right">DR Cost/mo</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(resources.resource_summary).map(([type, count]) => {
              const typeResources = resources.resources.filter(
                (r) => r.type === type,
              );
              const typeCost = typeResources.reduce(
                (sum, r) => sum + r.estimated_monthly_cost,
                0,
              );
              const typeRecs = plan.recommendations.filter(
                (r) => r.resource_type === type,
              );
              const drCost = typeRecs.reduce(
                (sum, r) => sum + r.estimated_dr_monthly_cost,
                0,
              );
              const strategy = typeRecs[0]?.pilot_light_action;

              return (
                <tr key={type} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 font-medium text-foreground">
                    {RESOURCE_TYPE_SHORT[
                      type as keyof typeof RESOURCE_TYPE_SHORT
                    ] ?? type}
                  </td>
                  <td className="px-6 py-3 text-right font-mono">{count}</td>
                  <td className="px-6 py-3 text-right font-mono">
                    {formatCurrency(typeCost)}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {strategy ? PILOT_LIGHT_ACTION_LABELS[strategy] : "-"}
                  </td>
                  <td className="px-6 py-3 text-right font-mono">
                    {formatCurrency(drCost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-emphasis bg-surface-raised/50">
              <td className="px-6 py-3 font-semibold">Total</td>
              <td className="px-6 py-3 text-right font-mono font-semibold">
                {resources.resources.length}
              </td>
              <td className="px-6 py-3 text-right font-mono font-semibold">
                {formatCurrency(resources.total_monthly_cost)}
              </td>
              <td className="px-6 py-3" />
              <td className="px-6 py-3 text-right font-mono font-semibold text-success">
                {formatCurrency(plan.total_dr_monthly_cost)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* CMDB details */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-base font-semibold">
          Application Metadata (CMDB)
        </h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <Detail label="Application" value={cmdb.application_name} />
          <Detail label="Owner" value={cmdb.owner} />
          <Detail
            label="Primary Region"
            value={formatRegion(cmdb.primary_region)}
          />
          <Detail label="DR Region" value={formatRegion(cmdb.dr_region)} />
          <Detail label="RTO" value={`${cmdb.rto_hours} hours`} />
          <Detail label="RPO" value={`${cmdb.rpo_hours} hours`} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}
