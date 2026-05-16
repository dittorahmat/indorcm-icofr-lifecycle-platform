import React from "react";
import { Outlet } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
import { AIFabButton, AIChatDrawer } from "@/components/ai-chatbot";
import { LicenseBanner, LicenseModal } from "@/components/LicenseNotifications";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAIChatStore } from "@/context/ai-chat-store";

export function RootLayout(): JSX.Element {
  const { isChatOpen, setIsChatOpen, toggleChat } = useAIChatStore();

  return (
    <SidebarProvider className="h-screen flex flex-col bg-background text-foreground min-w-0 overflow-hidden">
      <MainHeader />
      <LicenseBanner />
      <div className="flex-1 relative flex flex-col min-h-0 min-w-0 overflow-hidden">
        <Outlet />
      </div>

      <LicenseModal />
      {/* Global AI Chatbot */}
      <AIFabButton isOpen={isChatOpen} onToggle={toggleChat} />
      <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </SidebarProvider>
  );
}
export default RootLayout;