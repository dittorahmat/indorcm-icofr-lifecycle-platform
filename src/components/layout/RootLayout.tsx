import React from "react";
import { Outlet } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";

export function RootLayout(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MainHeader />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
export default RootLayout;