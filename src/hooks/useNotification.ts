import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

interface NotificationPayload {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  link?: string;
}

/**
 * Hook to trigger system-wide notifications.
 * Sends a notification to the backend and optionally shows a toast.
 */
export function useNotification() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: NotificationPayload) => api('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Show toast as well
      if (variables.type === 'success') {
        toast.success(variables.message);
      } else if (variables.type === 'error') {
        toast.error(variables.message);
      } else if (variables.type === 'warning') {
        toast.warning(variables.message);
      } else {
        toast.info(variables.message);
      }
    }
  });

  return {
    notify: (payload: NotificationPayload) => mutation.mutate(payload),
    isPending: mutation.isPending
  };
}
