import React, { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { enableMapSet } from "immer";
import '@/lib/errorReporter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSuspense } from '@/components/PageSuspense';
import '@/index.css';

// Lazy load all pages for optimized bundle size
const HomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const RCMList = lazy(() => import('@/pages/rcm/RCMList').then(module => ({ default: module.RCMList })));
const CSAWorkspace = lazy(() => import('@/pages/csa/CSAWorkspace').then(module => ({ default: module.CSAWorkspace })));
const TestWorkbench = lazy(() => import('@/pages/testing/TestWorkbench').then(module => ({ default: module.TestWorkbench })));
const DeficiencyBoard = lazy(() => import('@/pages/deficiencies/DeficiencyBoard').then(module => ({ default: module.DeficiencyBoard })));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage').then(module => ({ default: module.ReportsPage })));
const ImportPage = lazy(() => import('@/pages/import/ImportPage').then(module => ({ default: module.ImportPage })));
const ScopingPage = lazy(() => import('@/pages/scoping/ScopingPage').then(module => ({ default: module.ScopingPage })));
const ExternalAuditPortal = lazy(() => import('@/pages/audit/ExternalAuditPortal').then(module => ({ default: module.ExternalAuditPortal })));
const WBSPage = lazy(() => import('@/pages/reports/WBSPage').then(module => ({ default: module.WBSPage })));
const ChangeLogPage = lazy(() => import('@/pages/rcm/ChangeLogPage').then(module => ({ default: module.ChangeLogPage })));
const SOCMonitoringPage = lazy(() => import('@/pages/rcm/SOCMonitoringPage').then(module => ({ default: module.SOCMonitoringPage })));

enableMapSet();
const queryClient = new QueryClient();
const router = createBrowserRouter([
  { path: "/", element: <PageSuspense><HomePage /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/dashboard", element: <PageSuspense><Dashboard /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/scoping", element: <PageSuspense><ScopingPage /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/rcm", element: <PageSuspense><RCMList /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/change-log", element: <PageSuspense><ChangeLogPage /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/soc-monitoring", element: <PageSuspense><SOCMonitoringPage /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/csa", element: <PageSuspense><CSAWorkspace /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/testing", element: <PageSuspense><TestWorkbench /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/deficiencies", element: <PageSuspense><DeficiencyBoard /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/reports", element: <PageSuspense><ReportsPage /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/wbs-recap", element: <PageSuspense><WBSPage /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/audit-portal", element: <PageSuspense><ExternalAuditPortal /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/import", element: <PageSuspense><ImportPage /></PageSuspense>, errorElement: <RouteErrorBoundary /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster richColors closeButton />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
