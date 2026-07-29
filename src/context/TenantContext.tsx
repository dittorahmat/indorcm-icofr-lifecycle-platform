import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { TenantConfig, TenantId, TENANT_CONFIGS } from '../shared/tenantConfig';
import '../styles/tenants/company_b.css';

interface TenantContextType {
  tenant: TenantConfig;
  setTenantId?: (id: TenantId) => void;
}

const TenantContext = createContext<TenantContextType>({
  tenant: TENANT_CONFIGS.default,
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeTenantConfig = useMemo(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tenantParam = urlParams.get('tenant') as TenantId | null;
      if (tenantParam && TENANT_CONFIGS[tenantParam]) {
        return TENANT_CONFIGS[tenantParam];
      }
    }

    const envTenant = (import.meta.env.VITE_TENANT_ID as TenantId) || 'default';
    if (TENANT_CONFIGS[envTenant]) {
      return TENANT_CONFIGS[envTenant];
    }

    return TENANT_CONFIGS.default;
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-tenant', activeTenantConfig.id);
    }
  }, [activeTenantConfig]);

  return (
    <TenantContext.Provider value={{ tenant: activeTenantConfig }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
