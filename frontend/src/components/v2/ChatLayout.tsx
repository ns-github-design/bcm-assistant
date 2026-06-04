import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { StageBar } from "./StageBar";
import { ChatSidebar } from "./ChatSidebar";
import { ChatArea } from "./ChatArea";
import { ContextPanel } from "./ContextPanel";
import { useChatStore } from "../../store/chat";

export function ChatLayout() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { activeSessionId, loadSession, clearSession } = useChatStore();

  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Sync URL sessionId with store
  useEffect(() => {
    if (sessionId && sessionId !== activeSessionId) {
      const found = loadSession(sessionId);
      if (!found) {
        // Session doesn't exist, redirect to landing
        navigate("/", { replace: true });
      }
    } else if (!sessionId && activeSessionId) {
      // Navigated back to landing - clear active session
      clearSession();
    }
  }, [sessionId, activeSessionId, loadSession, clearSession, navigate]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Thin stage progress indicator */}
      <StageBar />

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar />
        <ChatArea />
        <ContextPanel />
      </div>

      {/* Theme toggle - fixed bottom-right */}
      <button
        onClick={() => setDark(!dark)}
        className="fixed bottom-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border text-muted-foreground hover:text-foreground v2-glow v2-transition"
        title={dark ? "Light mode" : "Dark mode"}
      >
        {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
