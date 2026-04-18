import React, { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { enableMapSet } from "immer";
import '@/lib/errorReporter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { PageSuspense } from '@/components/PageSuspense';
import { RootLayout } from '@/components/layout/RootLayout';
import '@/index.css';
import './i18n/config';

// Lazy load all pages for optimized bundle size
const HomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })));
// Don't lazy load LoginPage - critical route for auth flow (prevents logout errors)
import { LoginPage } from '@/pages/LoginPage';
const WelcomePage = lazy(() => import('@/pages/WelcomePage').then(module => ({ default: module.WelcomePage })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const RCMList = lazy(() => import('@/pages/rcm/RCMList').then(module => ({ default: module.RCMList })));
const TestWorkbench = lazy(() => import('@/pages/testing/TestWorkbench').then(module => ({ default: module.TestWorkbench })));
const DeficiencyBoard = lazy(() => import('@/pages/deficiencies/DeficiencyBoard').then(module => ({ default: module.DeficiencyBoard })));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage').then(module => ({ default: module.ReportsPage })));
const AIHubPage = lazy(() => import('@/pages/reports/AIHubPage').then(module => ({ default: module.AIHubPage })));
const ImportPage = lazy(() => import('@/pages/import/ImportPage').then(module => ({ default: module.ImportPage })));
const ScopingPage = lazy(() => import('@/pages/scoping/ScopingPage').then(module => ({ default: module.ScopingPage })));
const ApprovalPage = lazy(() => import('@/pages/scoping/ApprovalPage').then(module => ({ default: module.ApprovalPage })));
const ExternalAuditPortal = lazy(() => import('@/pages/audit/ExternalAuditPortal').then(module => ({ default: module.ExternalAuditPortal })));
const WBSPage = lazy(() => import('@/pages/reports/WBSPage').then(module => ({ default: module.WBSPage })));
const ChangeLogPage = lazy(() => import('@/pages/rcm/ChangeLogPage').then(module => ({ default: module.ChangeLogPage })));
const SOCMonitoringPage = lazy(() => import('@/pages/rcm/SOCMonitoringPage').then(module => ({ default: module.SOCMonitoringPage })));
const BPMPage = lazy(() => import('@/pages/bpm/BPMPage').then(module => ({ default: module.BPMPage })));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage').then(module => ({ default: module.UserManagementPage })));
const DocumentsPage = lazy(() => import('@/pages/knowledge/DocumentsPage').then(module => ({ default: module.DocumentsPage })));

import { authClient } from '@/lib/auth-client';

enableMapSet();
const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="h-screen w-full flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>;
  }

  return session ? <Outlet /> : <Navigate to="/" replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/welcome",
    element: <WelcomePage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: "/dashboard", element: <PageSuspense><Dashboard /></PageSuspense> },
          { path: "/scoping", element: <PageSuspense><ScopingPage /></PageSuspense> },
          { path: "/scoping/approval", element: <PageSuspense><ApprovalPage /></PageSuspense> },
          { path: "/rcm", element: <PageSuspense><RCMList /></PageSuspense> },
          { path: "/change-log", element: <PageSuspense><ChangeLogPage /></PageSuspense> },
          { path: "/soc-monitoring", element: <PageSuspense><SOCMonitoringPage /></PageSuspense> },
          { path: "/bpm", element: <PageSuspense><BPMPage /></PageSuspense> },
          { path: "/testing", element: <PageSuspense><TestWorkbench /></PageSuspense> },
          { path: "/deficiencies", element: <PageSuspense><DeficiencyBoard /></PageSuspense> },
          { path: "/reports", element: <PageSuspense><ReportsPage /></PageSuspense> },
          { path: "/ai-hub", element: <PageSuspense><AIHubPage /></PageSuspense> },
          { path: "/wbs-recap", element: <PageSuspense><WBSPage /></PageSuspense> },
          { path: "/audit-portal", element: <PageSuspense><ExternalAuditPortal /></PageSuspense> },
          { path: "/import", element: <PageSuspense><ImportPage /></PageSuspense> },
          { path: "/admin/users", element: <PageSuspense><UserManagementPage /></PageSuspense> },
          { path: "/documents", element: <PageSuspense><DocumentsPage /></PageSuspense> },
        ]
      },
    ]
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById('root')!).render(
  // Remove StrictMode for demo to avoid double-mounting issues
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>}>
          <RouterProvider router={router} />
        </Suspense>
        <Toaster richColors closeButton />
      </ErrorBoundary>
    </QueryClientProvider>
  // </StrictMode>,
);
