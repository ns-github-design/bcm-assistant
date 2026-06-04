import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useAssessmentStore } from "../store/assessment";

interface SubscriptionInputProps {
  onStart: () => void;
}

export function SubscriptionInput({ onStart }: SubscriptionInputProps) {
  const [subscriptionId, setSubscriptionId] = useState("");
  const { setSubscription, setIsAssessing } = useAssessmentStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionId.trim()) return;
    setSubscription(subscriptionId.trim(), false);
    setIsAssessing(true);
    onStart();
  };

  const handleDemo = () => {
    setSubscription("demo-trading-platform", true);
    setIsAssessing(true);
    onStart();
  };

  return (
    <div className="w-full max-w-lg space-y-6 px-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          BCM Assessment Agent
        </h1>
        <p className="text-sm text-muted-foreground">
          Evaluate Azure subscriptions for Pilot Light DR readiness and FinOps
          compliance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Enter Azure subscription ID..."
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={!subscriptionId.trim()}
          className="h-10 w-full rounded-md bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run Assessment
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <button
        onClick={handleDemo}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm text-foreground transition-colors hover:bg-surface-raised"
      >
        <Sparkles className="h-4 w-4 text-warning" />
        Demo: Trading Platform
      </button>
    </div>
  );
}
