import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRef, useCallback, useEffect } from 'react';

export function useUserPreferences() {
  return useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => api<{ layout: any }>('/api/user/preferences'),
  });
}

export function useSaveUserPreferences() {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<any>(null);

  const mutation = useMutation({
    mutationFn: (layout: any) =>
      api<{ success: boolean }>('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({ layout }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  const mutateDebounced = useCallback(
    (layout: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        mutation.mutate(layout);
      }, 2000); // 2-second debounce
    },
    [mutation]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...mutation,
    mutateDebounced,
  };
}
