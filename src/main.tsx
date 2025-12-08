import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import '@/index.css'
// Import Pages
import { HomePage } from '@/pages/HomePage';
import { Dashboard } from '@/pages/Dashboard';
import { RCMList } from '@/pages/rcm/RCMList';
import { CSAWorkspace } from '@/pages/csa/CSAWorkspace';
import { TestWorkbench } from '@/pages/testing/TestWorkbench';
import { DeficiencyBoard } from '@/pages/deficiencies/DeficiencyBoard';
import { ReportsPage } from '@/pages/reports/ReportsPage';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  { path: "/", element: <HomePage />, errorElement: <RouteErrorBoundary /> },
  { path: "/dashboard", element: <Dashboard />, errorElement: <RouteErrorBoundary /> },
  { path: "/rcm", element: <RCMList />, errorElement: <RouteErrorBoundary /> },
  { path: "/csa", element: <CSAWorkspace />, errorElement: <RouteErrorBoundary /> },
  { path: "/testing", element: <TestWorkbench />, errorElement: <RouteErrorBoundary /> },
  { path: "/deficiencies", element: <DeficiencyBoard />, errorElement: <RouteErrorBoundary /> },
  { path: "/reports", element: <ReportsPage />, errorElement: <RouteErrorBoundary /> },
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