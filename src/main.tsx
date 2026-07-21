if (typeof window !== 'undefined') {
  (window as any).process = { env: { NODE_ENV: import.meta.env.MODE || 'development' } };
}
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
import i18n from './i18n/config';

import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';
import { UnsavedChangesGuard } from '@/components/UnsavedChangesGuard';
import { ConfirmProvider } from '@/components/providers/ConfirmProvider';

// Lazy load all pages for optimized bundle size
const HomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })));
import { LoginPage } from '@/pages/LoginPage';
import { WelcomePage } from '@/pages/WelcomePage';
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const RCMList = lazy(() => import('@/pages/rcm/RCMList').then(module => ({ default: module.RCMList })));
const RCMTLCPage = lazy(() => import('@/pages/rcm/RCMTLCPage').then(module => ({ default: module.RCMTLCPage })));
const RCMELCPage = lazy(() => import('@/pages/rcm/RCMELCPage').then(module => ({ default: module.RCMELCPage })));
const RCMITGCPage = lazy(() => import('@/pages/rcm/RCMITGCPage').then(module => ({ default: module.RCMITGCPage })));
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
const VerificationDesignPage = lazy(() => import('@/pages/rcm/VerificationDesignPage').then(module => ({ default: module.VerificationDesignPage })));
const BPMPage = lazy(() => import('@/pages/bpm/BPMPage').then(module => ({ default: module.BPMPage })));
const CSAPage = lazy(() => import('@/pages/csa/CSAPage').then(module => ({ default: module.CSAPage })));
const TodoListPage = lazy(() => import('@/pages/csa/TodoListPage').then(module => ({ default: module.TodoListPage })));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage').then(module => ({ default: module.UserManagementPage })));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then(module => ({ default: module.SettingsPage })));
const DocumentsPage = lazy(() => import('@/pages/knowledge/DocumentsPage').then(module => ({ default: module.DocumentsPage })));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage').then(module => ({ default: module.NotificationsPage })));

import { ActivationPage } from '@/pages/ActivationPage';
import { LicenseGuard } from '@/components/LicenseGuard';
import { LicenseProvider } from '@/context/LicenseContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { I18nextProvider } from 'react-i18next';


import { registeredExtensions } from './extensions';

enableMapSet();
// Initialize query client
const queryClient = new QueryClient();

const coreRoutes = [
  { path: "/dashboard", element: <PageSuspense><Dashboard /></PageSuspense> },
  { path: "/scoping", element: <PageSuspense><ScopingPage /></PageSuspense> },
  { path: "/scoping/approval", element: <PageSuspense><ApprovalPage /></PageSuspense> },
  { path: "/rcm", element: <PageSuspense><RCMList /></PageSuspense> },
  { path: "/rcm/tlc", element: <PageSuspense><RCMTLCPage /></PageSuspense> },
  { path: "/rcm/elc", element: <PageSuspense><RCMELCPage /></PageSuspense> },
  { path: "/rcm/itgc", element: <PageSuspense><RCMITGCPage /></PageSuspense> },
  { path: "/rcm/verification-design", element: <PageSuspense><VerificationDesignPage /></PageSuspense> },

  { path: "/change-log", element: <PageSuspense><ChangeLogPage /></PageSuspense> },
  { path: "/soc-monitoring", element: <PageSuspense><SOCMonitoringPage /></PageSuspense> },
  { path: "/applications", element: <PageSuspense><SOCMonitoringPage /></PageSuspense> },
  { path: "/bpm", element: <PageSuspense><BPMPage /></PageSuspense> },
  { path: "/todo", element: <PageSuspense><TodoListPage /></PageSuspense> },
  { path: "/csa", element: <PageSuspense><CSAPage /></PageSuspense> },
  { path: "/testing", element: <PageSuspense><TestWorkbench /></PageSuspense> },
  { path: "/deficiencies", element: <PageSuspense><DeficiencyBoard /></PageSuspense> },
  { path: "/reports", element: <PageSuspense><ReportsPage /></PageSuspense> },
  { path: "/ai-hub", element: <PageSuspense><AIHubPage /></PageSuspense> },
  { path: "/wbs-recap", element: <PageSuspense><WBSPage /></PageSuspense> },
  { path: "/audit-portal", element: <PageSuspense><ExternalAuditPortal /></PageSuspense> },
  { path: "/import", element: <PageSuspense><ImportPage /></PageSuspense> },
  { path: "/settings", element: <PageSuspense><SettingsPage /></PageSuspense> },
  { path: "/admin/users", element: <PageSuspense><UserManagementPage /></PageSuspense> },
  { path: "/documents", element: <PageSuspense><DocumentsPage /></PageSuspense> },
  { path: "/notifications", element: <PageSuspense><NotificationsPage /></PageSuspense> },
];

const extensionRoutes = registeredExtensions.flatMap(ext =>
  ext.routes.map(route => ({
    path: route.path,
    element: <route.element />,
    errorElement: <RouteErrorBoundary />
  }))
);

const router = createBrowserRouter([
  {
    element: (
      <>
        <UnsavedChangesGuard />
        <Outlet />
      </>
    ),
    children: [
      {
        element: <LicenseGuard />,
        children: [
          {
            path: "/activate",
            element: <ActivationPage />,
          },
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
                  ...coreRoutes,
                  ...extensionRoutes
                ]
              },
            ]
          },
        ]
      },
    ]
  },
  { path: "*", element: <Navigate to="/" replace /> },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

const rootElement = document.getElementById('root')!;
// Avoid calling createRoot multiple times on the same element
const root = (rootElement as any)._reactRoot || createRoot(rootElement);
if (!(rootElement as any)._reactRoot) {
  (rootElement as any)._reactRoot = root;
}

root.render(
    <QueryClientProvider client={queryClient}>
      <LicenseProvider>
        <UnsavedChangesProvider>
          <ConfirmProvider>
            <I18nextProvider i18n={i18n}>
              <ErrorBoundary>
                <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>}>
                  <RouterProvider 
                    router={router} 
                    future={{
                      v7_startTransition: true,
                    }}
                  />
                </Suspense>
                <Toaster richColors closeButton />
              </ErrorBoundary>
            </I18nextProvider>
          </ConfirmProvider>
        </UnsavedChangesProvider>
      </LicenseProvider>
    </QueryClientProvider>
);
