import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Control } from '@shared/types';

/**
 * Single-field control update from the BPM worksheet. Served by the
 * standard `PUT /controls/:id` route (there is no `bpm-update` route —
 * the contract gate locks this). Extracted from BPMWorksheet to keep the
 * page under the module size limit.
 */
export function useWorksheetControlUpdate() {
  const queryClient = useQueryClient();
  const { t } = useTranslation(['bpm', 'common']);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Control> }) =>
      api(`/api/controls/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t('common:notifications.error'));
    },
  });
}
