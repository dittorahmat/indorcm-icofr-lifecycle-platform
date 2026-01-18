import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const PageSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><Skeleton className="h-screen w-full" /></div>}>
    {children}
  </Suspense>
);
