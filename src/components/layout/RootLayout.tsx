import React, { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AIFabButton, AIChatDrawer } from "@/components/ai-chatbot";
import { LicenseBanner, LicenseModal } from "@/components/LicenseNotifications";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAIChatStore } from "@/context/ai-chat-store";
import { useFiscalYearStore } from "@/store/useFiscalYearStore";
import { useUnsavedChangesContext } from "@/context/UnsavedChangesContext";

export function RootLayout(): JSX.Element {
  const { isChatOpen, setIsChatOpen, toggleChat } = useAIChatStore();
  const { isDirty } = useUnsavedChangesContext();
  const { workingYear } = useFiscalYearStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync workingYear from store to URL query parameter
  useEffect(() => {
    if (searchParams.get('year') !== workingYear) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('year', workingYear);
        return next;
      }, { replace: true });
    }
  }, [workingYear, searchParams, setSearchParams]);

  // Handle cross-tab synchronization for fiscal year
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if the fiscal year storage was modified from another tab
      if (event.key === 'fiscal-year-storage') {
        // If there are unsaved changes, we block the automatic sync to prevent data loss
        if (isDirty) {
          console.warn('Fiscal year changed in another tab, but sync was blocked due to unsaved changes.');
          return;
        }

        // Rehydrate the store to pick up changes from localStorage
        useFiscalYearStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isDirty]);

  return (
    <SidebarProvider className="h-screen flex flex-col bg-background text-foreground min-w-0 overflow-hidden">
      <MainHeader />
      <LicenseBanner />
      <div className="flex-1 relative flex flex-col min-h-0 min-w-0 overflow-hidden pb-14 md:pb-0">
        <Outlet />
      </div>

      <LicenseModal />
      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global AI Chatbot */}
      <AIFabButton isOpen={isChatOpen} onToggle={toggleChat} />
      <AIChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </SidebarProvider>
  );
}
export default RootLayout;