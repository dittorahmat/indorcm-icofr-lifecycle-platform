import React from "react";
import { Outlet } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
import { AIFabButton, AIChatDrawer } from "@/components/ai-chatbot";

export function RootLayout(): JSX.Element {
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MainHeader />
      <div className="flex-1 relative">
        <Outlet />
      </div>

      {/* Global AI Chatbot */}
      <AIFabButton isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
      <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
export default RootLayout;