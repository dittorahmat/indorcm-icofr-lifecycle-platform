if (typeof window !== 'undefined') {
  (window as any).process = { env: { NODE_ENV: import.meta.env.MODE || 'development' } };

  // Intercept Vite chunk preload failures (e.g. after fresh deployments) to reload automatically
  window.addEventListener('vite:preloadError', () => {
    const reloadKey = `icofr_vite_preload_${window.location.pathname}`;
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    }
  });
}
import React, { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { enableMapSet } from "immer";
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
import { RedirectWithSearch } from '@/components/RedirectWithSearch';
import { ConfirmProvider } from '@/components/providers/ConfirmProvider';
import { lazyWithRetry } from '@/lib/lazyWithRetry';
import { ROUTES } from '@/routes/paths';

// Lazy load all pages with automatic retry and reload resilience
const HomePage = lazyWithRetry(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })));
import { LoginPage } from '@/pages/LoginPage';
import { WelcomePage } from '@/pages/WelcomePage';
const Dashboard = lazyWithRetry(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const AnalyticsPage = lazyWithRetry(() => import('@/pages/analytics/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const RCMList = lazyWithRetry(() => import('@/pages/rcm/RCMList').then(module => ({ default: module.RCMList })));
const RCMTLCPage = lazyWithRetry(() => import('@/pages/rcm/RCMTLCPage').then(module => ({ default: module.RCMTLCPage })));
const RCMELCPage = lazyWithRetry(() => import('@/pages/rcm/RCMELCPage').then(module => ({ default: module.RCMELCPage })));
const RCMITGCPage = lazyWithRetry(() => import('@/pages/rcm/RCMITGCPage').then(module => ({ default: module.RCMITGCPage })));
const TestWorkbench = lazyWithRetry(() => import('@/pages/testing/TestWorkbench').then(module => ({ default: module.TestWorkbench })));
const DeficiencyBoard = lazyWithRetry(() => import('@/pages/deficiencies/DeficiencyBoard').then(module => ({ default: module.DeficiencyBoard })));
const ReportsPage = lazyWithRetry(() => import('@/pages/reports/ReportsPage').then(module => ({ default: module.ReportsPage })));
const Appendix10Page = lazyWithRetry(() => import('@/pages/reports/Appendix10Page').then(module => ({ default: module.Appendix10Page })));
const AIHubPage = lazyWithRetry(() => import('@/pages/reports/AIHubPage').then(module => ({ default: module.AIHubPage })));
const ImportPage = lazyWithRetry(() => import('@/pages/import/ImportPage').then(module => ({ default: module.ImportPage })));
const ScopingPage = lazyWithRetry(() => import('@/pages/scoping/ScopingPage').then(module => ({ default: module.ScopingPage })));
const ApprovalPage = lazyWithRetry(() => import('@/pages/scoping/ApprovalPage').then(module => ({ default: module.ApprovalPage })));
const ExternalAuditPortal = lazyWithRetry(() => import('@/pages/audit/ExternalAuditPortal').then(module => ({ default: module.ExternalAuditPortal })));
const WBSPage = lazyWithRetry(() => import('@/pages/reports/WBSPage').then(module => ({ default: module.WBSPage })));
const ChangeLogPage = lazyWithRetry(() => import('@/pages/rcm/ChangeLogPage').then(module => ({ default: module.ChangeLogPage })));
const SOCMonitoringPage = lazyWithRetry(() => import('@/pages/rcm/SOCMonitoringPage').then(module => ({ default: module.SOCMonitoringPage })));
const VerificationDesignPage = lazyWithRetry(() => import('@/pages/rcm/VerificationDesignPage').then(module => ({ default: module.VerificationDesignPage })));
const BPMPage = lazyWithRetry(() => import('@/pages/bpm/BPMPage').then(module => ({ default: module.BPMPage })));
const CSAPage = lazyWithRetry(() => import('@/pages/csa/CSAPage').then(module => ({ default: module.CSAPage })));
const TodoListPage = lazyWithRetry(() => import('@/pages/csa/TodoListPage').then(module => ({ default: module.TodoListPage })));
const UserManagementPage = lazyWithRetry(() => import('@/pages/admin/UserManagementPage').then(module => ({ default: module.UserManagementPage })));
const SettingsPage = lazyWithRetry(() => import('@/pages/admin/SettingsPage').then(module => ({ default: module.SettingsPage })));
const DocumentsPage = lazyWithRetry(() => import('@/pages/knowledge/DocumentsPage').then(module => ({ default: module.DocumentsPage })));
const NotificationsPage = lazyWithRetry(() => import('@/pages/notifications/NotificationsPage').then(module => ({ default: module.NotificationsPage })));

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
  { path: ROUTES.DASHBOARD, element: <PageSuspense><Dashboard /></PageSuspense> },
  { path: ROUTES.ANALYTICS, element: <PageSuspense><AnalyticsPage /></PageSuspense> },
  { path: ROUTES.SCOPING, element: <PageSuspense><ScopingPage /></PageSuspense> },
  { path: ROUTES.SCOPING_APPROVAL, element: <PageSuspense><ApprovalPage /></PageSuspense> },
  { path: ROUTES.RCM, element: <PageSuspense><RCMList /></PageSuspense> },
  { path: ROUTES.RCM_LEGACY_BPM, element: <RedirectWithSearch to={ROUTES.BPM} /> },
  { path: ROUTES.RCM_TLC, element: <PageSuspense><RCMTLCPage /></PageSuspense> },
  { path: ROUTES.RCM_ELC, element: <PageSuspense><RCMELCPage /></PageSuspense> },
  { path: ROUTES.RCM_ITGC, element: <PageSuspense><RCMITGCPage /></PageSuspense> },
  { path: ROUTES.RCM_VERIFICATION_DESIGN, element: <PageSuspense><VerificationDesignPage /></PageSuspense> },

  { path: ROUTES.CHANGE_LOG, element: <PageSuspense><ChangeLogPage /></PageSuspense> },
  { path: ROUTES.SOC_MONITORING, element: <PageSuspense><SOCMonitoringPage /></PageSuspense> },
  { path: ROUTES.APPLICATIONS, element: <PageSuspense><SOCMonitoringPage /></PageSuspense> },
  { path: ROUTES.BPM, element: <PageSuspense><BPMPage /></PageSuspense> },
  { path: ROUTES.TODO, element: <PageSuspense><TodoListPage /></PageSuspense> },
  { path: ROUTES.CSA, element: <PageSuspense><CSAPage /></PageSuspense> },
  { path: ROUTES.TESTING, element: <PageSuspense><TestWorkbench /></PageSuspense> },
  { path: ROUTES.DEFICIENCIES, element: <PageSuspense><DeficiencyBoard /></PageSuspense> },
  { path: ROUTES.REPORTS, element: <PageSuspense><ReportsPage /></PageSuspense> },
  { path: ROUTES.REPORTS_APPENDIX_10, element: <PageSuspense><Appendix10Page /></PageSuspense> },
  { path: ROUTES.AI_HUB, element: <PageSuspense><AIHubPage /></PageSuspense> },
  { path: ROUTES.WBS_RECAP, element: <PageSuspense><WBSPage /></PageSuspense> },
  { path: ROUTES.AUDIT_PORTAL, element: <PageSuspense><ExternalAuditPortal /></PageSuspense> },
  { path: ROUTES.IMPORT, element: <PageSuspense><ImportPage /></PageSuspense> },
  { path: ROUTES.SETTINGS, element: <PageSuspense><SettingsPage /></PageSuspense> },
  { path: ROUTES.ADMIN_USERS, element: <PageSuspense><UserManagementPage /></PageSuspense> },
  { path: ROUTES.DOCUMENTS, element: <PageSuspense><DocumentsPage /></PageSuspense> },
  { path: ROUTES.NOTIFICATIONS, element: <PageSuspense><NotificationsPage /></PageSuspense> },
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
            path: ROUTES.ACTIVATE,
            element: <ActivationPage />,
          },
          {
            path: ROUTES.HOME,
            element: <LoginPage />,
          },
          {
            path: ROUTES.WELCOME,
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
                <Suspense fallback={<div className="h-dvh w-full flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>}>
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
