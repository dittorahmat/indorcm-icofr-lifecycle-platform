import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { UserRole } from '@shared/types';

/**
 * The signed-in user's ICOFR role. `/api/user/me` is the single endpoint that
 * returns it, so the query key is owned here: the rollover card (#103) and the
 * scoping approval page both read the role, and a second key would make each
 * surface fetch the same row again (it used to be `['me']` on one of them).
 *
 * Returns `undefined` while the answer is in flight — callers that gate on it
 * must treat that as "not yet allowed", never as "allowed".
 */
export function useCurrentRole(): UserRole | undefined {
  const { data } = useCurrentUser();
  return data?.role;
}

export function useCurrentUser(): { data: { id: string; role: UserRole; name?: string; departmentId?: string; level?: string } | undefined } {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<{ id: string; role: UserRole; name?: string; departmentId?: string; level?: string }>('/api/user/me'),
  });
}
