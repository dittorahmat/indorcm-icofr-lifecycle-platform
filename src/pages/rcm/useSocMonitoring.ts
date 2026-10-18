/**
 * Server-state + write owner for `SOCMonitoringPage` (significant applications,
 * third-party SOC reports, vendor master). The page keeps only its local dialog
 * state; every `useQuery` / `useMutation` / cache write lives here so the
 * orchestrator stays a composition.
 *
 * The delete path is the one write in this surface: it now carries `onError`,
 * so a failed `DELETE /api/applications/:id` surfaces a toast instead of
 * failing silently (CODING_STANDARDS §"Write mutations surface failures").
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Application, SOCReport, Vendor } from '@shared/types';

export interface SocMonitoringData {
  applications: Application[];
  socReports: SOCReport[];
  vendors: Vendor[];
  isLoadingApplications: boolean;
  isLoadingSocReports: boolean;
  /** Validated `DELETE /api/applications/:id` + cache invalidation + feedback. */
  removeApplication: (id: string) => void;
}

export function useSocMonitoring(): SocMonitoringData {
  const { t } = useTranslation('rcm');
  const queryClient = useQueryClient();

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications'),
  });

  const { data: socResponse, isLoading: isLoadingSocReports } = useQuery({
    queryKey: ['soc-reports'],
    queryFn: () => api<{ items: SOCReport[] }>('/api/soc-reports'),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api<{ items: Vendor[] }>('/api/vendors'),
  });

  const deleteApplication = useMutation({
    mutationFn: (id: string) => api(`/api/applications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(t('rcm:soc.delete_app_success', { defaultValue: 'Application removed from library' }));
    },
    onError: (error: unknown) => {
      toast.error(
        t('rcm:soc.delete_app_failed', { defaultValue: 'Could not remove the application. Please try again.' }),
        { description: error instanceof Error ? error.message : undefined },
      );
    },
  });

  return {
    applications: applicationsData?.items ?? [],
    socReports: socResponse?.items ?? [],
    vendors: vendorsData?.items ?? [],
    isLoadingApplications,
    isLoadingSocReports,
    removeApplication: (id: string) => deleteApplication.mutate(id),
  };
}
