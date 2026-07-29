export type TenantId = 'default' | 'company_a' | 'company_b';

export type AuthProviderType = 'standard' | 'company_b_jwt';

export interface TenantConfig {
  id: TenantId;
  name: string;
  isEmbedded: boolean;
  authProvider: AuthProviderType;
  themeClass: string;
  logoUrl?: string;
  features: {
    opriskSync?: boolean;
    customWorkflow?: boolean;
  };
}

export const TENANT_CONFIGS: Record<TenantId, TenantConfig> = {
  default: {
    id: 'default',
    name: 'IndoGRC Pro',
    isEmbedded: false,
    authProvider: 'standard',
    themeClass: 'theme-default',
    features: {
      opriskSync: false,
    },
  },
  company_a: {
    id: 'company_a',
    name: 'IndoGRC Whitelabel A',
    isEmbedded: false,
    authProvider: 'standard',
    themeClass: 'theme-company-a',
    features: {
      customWorkflow: true,
    },
  },
  company_b: {
    id: 'company_b',
    name: 'GRC OpRisk Module (Company B)',
    isEmbedded: true,
    authProvider: 'company_b_jwt',
    themeClass: 'theme-company-b',
    features: {
      opriskSync: true,
    },
  },
};
