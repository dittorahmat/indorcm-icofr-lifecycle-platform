import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api-client';
import { settingsErrorMessage } from '../hooks/useSettingsDraft';
import type { WebhookField } from './settings-webhook-config';

interface SettingsWebhookRowProps {
  field: WebhookField;
  enabled: boolean;
  url: string;
  onEnabledChange: (value: boolean) => void;
  onUrlChange: (value: string) => void;
}

/**
 * One webhook provider row, rendered from a `WEBHOOK_FIELDS` entry — toggle,
 * active/disabled badge, endpoint input and a test button whose spinner is the
 * mutation's own `isPending` (no extra `useState` per provider).
 */
export function SettingsWebhookRow({
  field,
  enabled,
  url,
  onEnabledChange,
  onUrlChange,
}: SettingsWebhookRowProps) {
  const { t } = useTranslation('common');

  const testWebhook = useMutation({
    mutationFn: () =>
      api('/api/settings/test-webhook', {
        method: 'POST',
        body: JSON.stringify({ provider: field.provider, webhookUrl: url }),
      }),
    onSuccess: () => toast.success(t('webhookSettings.testSuccess')),
    onError: (error: unknown) =>
      toast.error(settingsErrorMessage(error, t('webhookSettings.testError'))),
  });

  const title = t(field.titleKey);

  return (
    <div
      data-testid="settings-webhook-row"
      data-provider={field.provider}
      className="p-4 border rounded-lg bg-slate-50/30 space-y-3 min-w-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500">{t(field.descKey)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch checked={enabled} onCheckedChange={onEnabledChange} aria-label={title} />
          <Badge variant={enabled ? 'default' : 'outline'} className="text-xs">
            {enabled ? t('webhookSettings.enabled') : t('webhookSettings.disabled')}
          </Badge>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
        <Input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={t(field.placeholderKey)}
          aria-label={title}
          className="font-mono text-base sm:text-xs h-11 sm:h-10 min-h-[44px] sm:min-h-0 min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={testWebhook.isPending || !url}
          onClick={() => testWebhook.mutate()}
          className="gap-2 shrink-0 border-sky-200 text-sky-700 hover:bg-sky-50 h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center"
        >
          {testWebhook.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {t('webhookSettings.testWebhook')}
        </Button>
      </div>
    </div>
  );
}
