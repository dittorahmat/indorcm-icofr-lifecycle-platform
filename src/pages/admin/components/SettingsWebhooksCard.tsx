import { useTranslation } from 'react-i18next';
import { Webhook } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Settings } from '@shared/types';
import { SettingsWebhookRow } from './SettingsWebhookRow';
import { WEBHOOK_FIELDS } from './settings-webhook-config';
import type { SetSettingsField } from '../hooks/useSettingsDraft';

interface SettingsWebhooksCardProps {
  settings: Settings;
  setField: SetSettingsField;
}

/**
 * Multi-channel webhook integration card. The three provider rows come from ONE
 * `WEBHOOK_FIELDS` array — there is no per-provider JSX copy, so a fourth channel
 * is a config entry plus its two `Settings` fields.
 */
export function SettingsWebhooksCard({ settings, setField }: SettingsWebhooksCardProps) {
  const { t } = useTranslation('common');

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-sky-100 rounded-lg text-sky-600 shrink-0">
            <Webhook className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>{t('webhookSettings.title')}</CardTitle>
            <CardDescription>{t('webhookSettings.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {WEBHOOK_FIELDS.map((field) => (
          <SettingsWebhookRow
            key={field.provider}
            field={field}
            enabled={settings[field.enabledKey] ?? false}
            url={settings[field.urlKey] ?? ''}
            onEnabledChange={(value) => setField(field.enabledKey, value)}
            onUrlChange={(value) => setField(field.urlKey, value)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
