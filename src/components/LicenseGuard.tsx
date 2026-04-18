import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface LicenseStatus {
  status: 'active' | 'expired' | 'tampered' | 'unactivated' | 'MACHINE_MISMATCH';
  machineId: string;
  daysRemaining: number;
  clientName?: string;
}

interface LicenseContextType {
  license: LicenseStatus | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) throw new Error('useLicense must be used within LicenseProvider');
  return context;
};

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/license/status');
      const data = await res.json();
      if (data.success) {
        setLicense(data.data);
      }
    } catch (err) {
      console.error('License check failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <LicenseContext.Provider value={{ license, isLoading, refresh: fetchStatus }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const LicenseGuard = () => {
  const { license, isLoading } = useLicense();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>;
  }

  // If not active and not already on activation page, redirect
  if (license?.status !== 'active' && location.pathname !== '/activate') {
    return <Navigate to="/activate" replace />;
  }

  // If already active and on activation page, redirect to home
  if (license?.status === 'active' && location.pathname === '/activate') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
