/**
 * RootLayout.tsx
 *
 * Root layout component that ensures the MainHeader is rendered inside
 * the React Router context so that navigation hooks (useNavigate, Link, etc.)
 * work correctly. Renders an Outlet for nested routes.
 *
 * This component is intentionally minimal — it only composes the page header
 * and the Outlet. Page-level layout (sidebars, containers, etc.) can be
 * applied by individual pages or higher-order layout components.
 */
import React from "react";
import { Outlet } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
/**
 * RootLayout
 *
 * Renders the MainHeader (navigation / role switcher) and the Router Outlet.
 * Use this as the top-level layout element inside RouterProvider so all header
 * interactions have access to router hooks.
 */
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