import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useConfirm } from '@/hooks/use-confirm';

/**
 * Dev-only scoping purge flow (Admin, non-production, confirm token —
 * enforced server-side). Extracted from ScopingPage to keep the page under
 * the module size limit; the destructive POST itself is covered by the
 * frontend→backend contract gate.
 */
export function usePurgeScoping() {
  const { t } = useTranslation(['scoping', 'common']);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const purgeScoping = async (): Promise<boolean> => {
    const ok = await confirm({
      title: t('scoping:resetDataButton'),
      description: t('scoping:purgeConfirm'),
      variant: 'destructive',
    });
    if (!ok) return false;
    try {
      await api('/api/dev/purge-scoping', { method: 'POST' });
      queryClient.invalidateQueries();
      toast.success(t('common:notifications.purged'));
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common:notifications.error'));
      return false;
    }
  };

  return { purgeScoping };
}
