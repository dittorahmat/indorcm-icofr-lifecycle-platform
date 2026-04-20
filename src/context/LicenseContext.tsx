import React, { createContext, useContext, useEffect, useState } from 'react';

export interface LicenseStatus {
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
