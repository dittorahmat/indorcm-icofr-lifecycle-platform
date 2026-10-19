import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import {
  addCustomWidget,
  defaultLayouts,
  patchWidget,
  readStoredLayouts,
  reconcileLayout,
  toggleWidget,
  type Layouts,
  type WidgetLayout,
} from './dashboard-layout';

/** The one cache entry that is both the server truth and the in-progress draft. */
const DASHBOARD_QUERY_KEY = ['user-preferences'] as const;

interface DashboardPreferences {
  layout?: unknown;
}

export interface DashboardDraft {
  /** Cache content; the defaults when the server has no preference yet. */
  layouts: Layouts;
  isLoading: boolean;
  isSaving: boolean;
  toggleWidget: (id: string) => void;
  addCustomWidget: () => void;
  patchWidget: (id: string, patch: Partial<WidgetLayout>) => void;
  /** Folds the grid's `onLayoutChange` payload back in. */
  reconcile: (reported: unknown) => void;
  reset: () => void;
}

/**
 * The dashboard draft IS the `['user-preferences']` cache entry — the pattern
 * `useSettingsDraft` proved for Settings.
 *
 * Reads come from `useQuery`; every edit goes back through `setQueryData`; the
 * write re-reads the cache when it fires, so the PUT body is always the layout
 * the user is looking at. The component used to mirror the server preference into
 * `useState` through a `useEffect`, which means a refetch could leave a stale copy
 * for the next save to write back over the newer server value — the exact class of
 * bug an optimistic-cache write cannot have, because there is no second copy.
 *
 * The old write also had no `onError`: a failed save was silent. It now surfaces
 * the server message, with a localized fallback.
 */
export function useDashboardDraft(): DashboardDraft {
  const { t } = useTranslation('reports');
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => api<DashboardPreferences>('/api/user/preferences'),
  });

  const saveMutation = useMutation({
    mutationFn: (layouts: Layouts) =>
      api('/api/user/preferences', { method: 'PUT', body: JSON.stringify({ layout: layouts }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error && error.message ? error.message : t('customizableDashboard.saveFailed'));
    },
  });

  const layouts = readStoredLayouts(data?.layout) ?? defaultLayouts();

  const write = useCallback(
    (next: Layouts) => {
      queryClient.setQueryData<DashboardPreferences>(DASHBOARD_QUERY_KEY, (prev) => ({ ...(prev ?? {}), layout: next }));
    },
    [queryClient],
  );

  /** Reads the cache at fire time — never a copy captured when the drag started. */
  const save = useCallback(() => {
    const draft = readStoredLayouts(queryClient.getQueryData<DashboardPreferences>(DASHBOARD_QUERY_KEY)?.layout);
    if (draft) saveMutation.mutate(draft);
  }, [queryClient, saveMutation]);

  /** Grid drags and typing fire often; the PUT waits for the user to settle. */
  const saveDebounced = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 2000);
  }, [save]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const applyNext = useCallback(
    (next: Layouts, flush: 'now' | 'debounced') => {
      write(next);
      if (flush === 'now') save();
      else saveDebounced();
    },
    [write, save, saveDebounced],
  );

  return {
    layouts,
    isLoading,
    isSaving: saveMutation.isPending,
    toggleWidget: (id) => applyNext(toggleWidget(layouts, id), 'debounced'),
    addCustomWidget: () => applyNext(addCustomWidget(layouts, `custom-${Date.now()}`), 'now'),
    patchWidget: (id, patch) => applyNext(patchWidget(layouts, id, patch), 'debounced'),
    reconcile: (reported) => applyNext(reconcileLayout(layouts, reported), 'debounced'),
    reset: () => applyNext(defaultLayouts(), 'now'),
  };
}
