import { useState } from "react";
import { useAssessmentStore } from "../store/assessment";
import { OverviewTab } from "./tabs/OverviewTab";
import { DRPlanTab } from "./tabs/DRPlanTab";
import { CostExplorerTab } from "./tabs/CostExplorerTab";
import { LayoutDashboard, Shield, DollarSign } from "lucide-react";

const TABS = [
  { id: "overview", label: "Assessment Overview", icon: LayoutDashboard },
  { id: "dr-plan", label: "DR Plan", icon: Shield },
  { id: "cost", label: "Cost & RTO Overview", icon: DollarSign },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ResultsPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { assessmentResult } = useAssessmentStore();

  if (!assessmentResult) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Assessment results will appear here once the agent completes.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 border-b border-border px-6 bg-background">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content - centered with max width */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          {activeTab === "overview" && <OverviewTab data={assessmentResult} />}
          {activeTab === "dr-plan" && <DRPlanTab data={assessmentResult} />}
          {activeTab === "cost" && <CostExplorerTab data={assessmentResult} />}
        </div>
      </div>
    </div>
  );
}
