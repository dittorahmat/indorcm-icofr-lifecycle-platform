import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Settings } from '@shared/types';

export function useOrganizationBranding() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    companyName: settings?.companyName || "GRC Integra",
    logoUrl: settings?.logoUrl,
    isLoading
  };
}
