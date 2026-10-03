import React from 'react';
import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';

export const ProtectedRoute = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="h-dvh w-full flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>;
  }

  return session ? <Outlet /> : <Navigate to="/" replace />;
};
