import { useState } from "react";
import { AgentPanel } from "./AgentPanel";
import { ResultsPanel } from "./ResultsPanel";
import { SubscriptionInput } from "./SubscriptionInput";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useAssessmentStore } from "../store/assessment";

export function LegacyApp() {
  const [started, setStarted] = useState(false);
  const { assessmentResult } = useAssessmentStore();
  const [activeView, setActiveView] = useState<"chat" | "results">("chat");

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />

      {!started ? (
        <div className="flex flex-1 items-center justify-center">
          <SubscriptionInput onStart={() => setStarted(true)} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeView={activeView}
            onViewChange={(v) => setActiveView(v)}
            hasResults={!!assessmentResult}
          />

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center border-b border-border bg-surface">
              <button
                onClick={() => setActiveView("chat")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeView === "chat"
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Copilot Chat
              </button>
              <button
                onClick={() => setActiveView("results")}
                disabled={!assessmentResult}
                className={`px-6 py-3 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeView === "results"
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Assessment Results
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className={activeView === "chat" ? "h-full" : "hidden"}>
                <AgentPanel />
              </div>
              <div className={activeView === "results" ? "h-full" : "hidden"}>
                <ResultsPanel />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
