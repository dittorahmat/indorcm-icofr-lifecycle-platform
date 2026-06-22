import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Control, TODEvaluation } from '@shared/types';
import { toast } from 'sonner';

export function useTOD(csaId?: string) {
  const queryClient = useQueryClient();

  const { data: evaluations, isLoading: isEvalLoading } = useQuery({
    queryKey: ['tod-evaluations', csaId],
    queryFn: () => api<{ items: TODEvaluation[] }>(`/api/tod-evaluations?csaId=${csaId}`),
    enabled: !!csaId,
  });

  const saveMutation = useMutation({
    mutationFn: (values: any) => api<TODEvaluation>('/api/tod-evaluations', {
      method: 'POST',
      body: JSON.stringify({ ...values, csaId }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tod-evaluations', csaId] });
      toast.success("Evaluation Saved: Test of Design evaluation has been successfully updated.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save evaluation.");
    }
  });

  const getControlDetails = async (controlId: string) => {
    return api<Control>(`/api/controls/${controlId}`);
  };

  return {
    evaluations: evaluations?.items || [],
    isEvalLoading,
    saveMutation,
    getControlDetails,
  };
}
