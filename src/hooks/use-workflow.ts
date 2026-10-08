import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { WorkflowAction } from '@shared/types';
import { workflowEndpointFor, type WorkflowEntityType } from '@shared/workflow-transitions';
import { useTranslation } from 'react-i18next';

interface WorkflowResponse {
  success: boolean;
  nextStatus: string;
  deficiencyId: string | null;
}

interface ExecuteActionInput {
  action: WorkflowAction;
  note: string;
  assigneeId?: string;
}

const INVALIDATED_KEYS: Record<WorkflowEntityType, string[][]> = {
  BPM: [['bpm-processes']],
  ACTION_PLAN: [['actionplans'], ['deficiencies']],
  SCOPING: [['simulations']],
  RCM_CHANGE: [['rcm-matrix-tlc'], ['controls'], ['changelogs']],
  CSA: [['csa-records']],
};

export function useWorkflow(entityType: WorkflowEntityType, entityId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  const workflowMutation = useMutation({
    mutationFn: async ({ action, note, assigneeId }: ExecuteActionInput) => {
      // Single route table: endpoint taxonomy cannot drift from the server.
      const endpoint = workflowEndpointFor(entityType, entityId);
      return await api<WorkflowResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ action, note, assigneeId })
      });
    },
    onSuccess: () => {
      for (const queryKey of INVALIDATED_KEYS[entityType]) {
        queryClient.invalidateQueries({ queryKey });
      }
      if (entityType === 'BPM') {
        queryClient.invalidateQueries({ queryKey: ['bpm-process', entityId] });
      }
      if (entityType === 'CSA') {
        queryClient.invalidateQueries({ queryKey: ['csa-record-detail', entityId] });
      }
      toast.success(t('notifications.updated'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return {
    executeAction: workflowMutation.mutate,
    isPending: workflowMutation.isPending
  };
}
