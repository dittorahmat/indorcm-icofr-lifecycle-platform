import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import '@/index.css'
// Import Pages
import { HomePage } from '@/pages/HomePage';
import { Dashboard } from '@/pages/Dashboard';
import { RCMList } from '@/pages/rcm/RCMList';
import { CSAWorkspace } from '@/pages/csa/CSAWorkspace';
import { TestWorkbench } from '@/pages/testing/TestWorkbench';
import { DeficiencyBoard } from '@/pages/deficiencies/DeficiencyBoard';
// Lazy load for performance optimization
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage').then(module => ({ default: module.ReportsPage })));
const ImportPage = lazy(() => import('@/pages/import/ImportPage').then(module => ({ default: module.ImportPage })));
const queryClient = new QueryClient();
const router = createBrowserRouter([
  { path: "/", element: <HomePage />, errorElement: <RouteErrorBoundary /> },
  { path: "/dashboard", element: <Dashboard />, errorElement: <RouteErrorBoundary /> },
  { path: "/rcm", element: <RCMList />, errorElement: <RouteErrorBoundary /> },
  { path: "/csa", element: <CSAWorkspace />, errorElement: <RouteErrorBoundary /> },
  { path: "/testing", element: <TestWorkbench />, errorElement: <RouteErrorBoundary /> },
  { path: "/deficiencies", element: <DeficiencyBoard />, errorElement: <RouteErrorBoundary /> },
  { path: "/reports", element: <Suspense fallback={<Skeleton className="h-screen w-full" />}><ReportsPage /></Suspense>, errorElement: <RouteErrorBoundary /> },
  { path: "/import", element: <Suspense fallback={<Skeleton className="h-screen w-full" />}><ImportPage /></Suspense>, errorElement: <RouteErrorBoundary /> },
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
)