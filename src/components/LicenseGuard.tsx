import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useLicense } from '@/context/LicenseContext';

export const LicenseGuard = () => {
  const { license, isLoading } = useLicense();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-dvh w-full flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>;
  }

  // If not active and not already on activation page, redirect
  if (license?.status !== 'active' && location.pathname !== '/activate') {
    return <Navigate to="/activate" replace />;
  }

  // If already active and on activation page, allow it (for renewal)
  if (license?.status === 'active' && location.pathname === '/activate') {
    return <Outlet />;
  }

  return <Outlet />;
};
