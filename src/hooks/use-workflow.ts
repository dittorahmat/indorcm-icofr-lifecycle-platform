import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { WorkflowAction } from '@shared/types';
import { useTranslation } from 'react-i18next';

export function useWorkflow(entityType: 'BPM' | 'ACTION_PLAN' | 'SCOPING' | 'RCM_CHANGE' | 'CSA', entityId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  const workflowMutation = useMutation({
    mutationFn: async ({ action, note, assigneeId }: { action: WorkflowAction, note: string, assigneeId?: string }) => {
      let endpoint = '';
      switch (entityType) {
        case 'BPM': 
          endpoint = `/api/bpm-processes/${entityId}/workflow`;
          break;
        case 'ACTION_PLAN':
          endpoint = `/api/actionplans/${entityId}/workflow`;
          break;
        case 'SCOPING':
          endpoint = `/api/simulations/${entityId}/workflow`;
          break;
        case 'RCM_CHANGE':
          endpoint = `/api/rcm/${entityId}/workflow`;
          break;
        case 'CSA':
          endpoint = `/api/csa/${entityId}/workflow`;
          break;
      }
        
      return await api<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ action, note, assigneeId })
      });
    },
    onSuccess: () => {
      if (entityType === 'BPM') {
        queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
        queryClient.invalidateQueries({ queryKey: ['bpm-process', entityId] });
      } else if (entityType === 'ACTION_PLAN') {
        queryClient.invalidateQueries({ queryKey: ['actionplans'] });
        queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
      } else if (entityType === 'SCOPING') {
        queryClient.invalidateQueries({ queryKey: ['simulations'] });
      } else if (entityType === 'RCM_CHANGE') {
        queryClient.invalidateQueries({ queryKey: ['rcm-matrix-tlc'] });
        queryClient.invalidateQueries({ queryKey: ['controls'] });
        queryClient.invalidateQueries({ queryKey: ['changelogs'] });
      } else if (entityType === 'CSA') {
        queryClient.invalidateQueries({ queryKey: ['csa-records'] });
        queryClient.invalidateQueries({ queryKey: ['csa-record-detail', entityId] });
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
