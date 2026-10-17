import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Settings } from '@shared/types';

/** Single cache entry that is both the server truth and the in-progress draft. */
export const SETTINGS_QUERY_KEY = ['settings'] as const;

/** Domain-typed write: `setField('smtpPort', 587)` type-checks, `setField('smtpPort', 'x')` does not. */
export type SetSettingsField = <K extends keyof Settings>(key: K, value: Settings[K]) => void;

/** Server error text with a localized fallback — `unknown`, never `any`. */
export function settingsErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export interface SettingsDraft {
  /** Cache content; `undefined` until the first fetch resolves. */
  settings: Settings | undefined;
  /** True until the first fetch resolves — the page renders its skeleton on it. */
  isLoading: boolean;
  isSaving: boolean;
  setField: SetSettingsField;
  save: () => void;
}

/**
 * The draft IS the `['settings']` query-cache entry.
 *
 * Reads come from `useQuery`; every edit is written straight back through
 * `setQueryData` (which notifies this subscriber, so the form re-renders from the
 * cache); `save()` re-reads the cache at call time and PUTs that snapshot. There is
 * no `useState` mirror and no `useEffect` sync, so a refetch can never leave a
 * stale copy behind for the next save to write back — the whole-object PUT
 * payload is always the cache the user is looking at.
 */
export function useSettingsDraft(): SettingsDraft {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => api<Settings>('/api/settings'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Settings) =>
      api('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast.success(t('settings.saveSuccess', { defaultValue: 'System settings updated successfully' }));
    },
    onError: (error: unknown) => {
      toast.error(
        settingsErrorMessage(error, t('settings.saveError', { defaultValue: 'Failed to update settings' })),
      );
    },
  });

  const setField = useCallback<SetSettingsField>(
    (key, value) => {
      queryClient.setQueryData<Settings>(SETTINGS_QUERY_KEY, (prev) =>
        prev ? { ...prev, [key]: value } : prev,
      );
    },
    [queryClient],
  );

  const save = useCallback(() => {
    const draft = queryClient.getQueryData<Settings>(SETTINGS_QUERY_KEY);
    if (draft) saveMutation.mutate(draft);
  }, [queryClient, saveMutation]);

  return { settings, isLoading, isSaving: saveMutation.isPending, setField, save };
}
