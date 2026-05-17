import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { WorkflowAction } from '@shared/types';
import { useTranslation } from 'react-i18next';

export function useWorkflow(entityType: 'BPM' | 'ACTION_PLAN', entityId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  const workflowMutation = useMutation({
    mutationFn: async ({ action, note }: { action: WorkflowAction, note: string }) => {
      const endpoint = entityType === 'BPM' 
        ? `/api/bpm-processes/${entityId}/workflow`
        : `/api/actionplans/${entityId}/workflow`;
        
      return await api<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ action, note })
      });
    },
    onSuccess: () => {
      if (entityType === 'BPM') {
        queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
        queryClient.invalidateQueries({ queryKey: ['bpm-diagrams'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['action-plans'] });
        queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
      }
      toast.success(t('notifications.updated'));
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  return {
    executeAction: workflowMutation.mutate,
    isPending: workflowMutation.isPending
  };
}
