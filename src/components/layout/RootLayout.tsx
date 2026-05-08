import React from "react";
import { Outlet } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
import { AIFabButton, AIChatDrawer } from "@/components/ai-chatbot";
import { LicenseBanner, LicenseModal } from "@/components/LicenseNotifications";
import { SidebarProvider } from "@/components/ui/sidebar";

export function RootLayout(): JSX.Element {
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  return (
    <SidebarProvider className="min-h-screen flex flex-col bg-background text-foreground">
      <MainHeader />
      <LicenseBanner />
      <div className="flex-1 relative flex flex-col">
        <Outlet />
      </div>

      <LicenseModal />
      {/* Global AI Chatbot */}
      <AIFabButton isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
      <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </SidebarProvider>
  );
}
export default RootLayout;