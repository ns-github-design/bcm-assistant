import { Shield, Sparkles, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export function TopBar() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="flex h-11 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
          <Shield className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          BCM Assistant
        </span>
        <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
          <Sparkles className="h-2.5 w-2.5" />
          Copilot
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark(!dark)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-raised"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>
        <span className="text-[10px] text-muted-foreground">
          GitHub Copilot SDK
        </span>
      </div>
    </header>
  );
}
