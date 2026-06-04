import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChatLayout } from "./components/v2/ChatLayout";
import { LegacyApp } from "./components/LegacyApp";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatLayout />} />
        <Route path="/c/:sessionId" element={<ChatLayout />} />
        <Route path="/v1" element={<LegacyApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
