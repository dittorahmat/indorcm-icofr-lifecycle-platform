import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Settings } from '@shared/types';
import { api } from '@/lib/api-client';
import { SettingsField } from './SettingsField';
import { settingsErrorMessage, type SetSettingsField } from '../hooks/useSettingsDraft';

interface SettingsEmailCardProps {
  settings: Settings;
  setField: SetSettingsField;
}

const DEFAULT_SMTP_PORT = 587;

/** Email notification transport: provider choice plus the SMTP credentials block. */
export function SettingsEmailCard({ settings, setField }: SettingsEmailCardProps) {
  const { t } = useTranslation('common');
  const isSmtp = settings.emailProvider === 'smtp';
  const smtpPort = settings.smtpPort ?? DEFAULT_SMTP_PORT;

  const testEmail = useMutation({
    mutationFn: () =>
      api('/api/settings/test-email', { method: 'POST', body: JSON.stringify(settings) }),
    onSuccess: () => toast.success(t('emailSettings.testSuccess')),
    onError: (error: unknown) =>
      toast.error(settingsErrorMessage(error, t('emailSettings.testError'))),
  });

  const securityLabel = smtpPort === 465
    ? t('emailSettings.ssl')
    : smtpPort === 587
      ? t('emailSettings.starttls')
      : t('emailSettings.unencrypted');

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 min-w-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle>{t('emailSettings.title')}</CardTitle>
              <CardDescription>{t('emailSettings.description')}</CardDescription>
            </div>
          </div>
          {isSmtp && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testEmail.isPending}
              onClick={() => testEmail.mutate()}
              className="gap-2 shrink-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 w-full sm:w-auto min-h-[44px] sm:min-h-0 justify-center"
            >
              {testEmail.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {t('emailSettings.testConnection')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            controlId="settings-email-provider"
            label={t('emailSettings.provider')}
          >
            <Select
              value={settings.emailProvider ?? 'system'}
              onValueChange={(val) => setField('emailProvider', val === 'smtp' ? 'smtp' : 'system')}
            >
              <SelectTrigger id="settings-email-provider" className="w-full">
                <SelectValue placeholder={t('placeholders.choose')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{t('emailSettings.systemDefault')}</SelectItem>
                <SelectItem value="smtp">{t('emailSettings.customSmtp')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField controlId="settings-sender-name" label={t('emailSettings.senderName')}>
            <Input
              id="settings-sender-name"
              value={settings.senderName ?? ''}
              onChange={(e) => setField('senderName', e.target.value)}
              placeholder={t('settings.email.senderNamePlaceholder', {
                defaultValue: 'e.g. IndoGRC Pro Notifications',
              })}
              disabled={!isSmtp}
            />
          </SettingsField>
        </div>

        {isSmtp && (
          <>
            <Separator className="my-4" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <SettingsField controlId="settings-sender-email" label={t('emailSettings.senderEmail')}>
                    <Input
                      id="settings-sender-email"
                      type="email"
                      value={settings.senderEmail ?? ''}
                      onChange={(e) => setField('senderEmail', e.target.value)}
                      placeholder="info@dsintegra.co.id"
                    />
                  </SettingsField>
                </div>
                <SettingsField controlId="settings-smtp-port" label={t('emailSettings.smtpPort')}>
                  <Input
                    id="settings-smtp-port"
                    type="number"
                    value={smtpPort}
                    onChange={(e) =>
                      setField('smtpPort', Number.parseInt(e.target.value, 10) || DEFAULT_SMTP_PORT)
                    }
                    placeholder="587"
                  />
                </SettingsField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <SettingsField controlId="settings-smtp-host" label={t('emailSettings.smtpHost')}>
                    <Input
                      id="settings-smtp-host"
                      value={settings.smtpHost ?? ''}
                      onChange={(e) => setField('smtpHost', e.target.value)}
                      placeholder="e.g. mail.dsintegra.co.id"
                    />
                  </SettingsField>
                </div>
                <div className="space-y-2 min-w-0">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    {t('emailSettings.smtpSecurity')}
                  </span>
                  <p className="text-sm font-semibold py-2.5 text-slate-600">{securityLabel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsField controlId="settings-smtp-user" label={t('emailSettings.smtpUser')}>
                  <Input
                    id="settings-smtp-user"
                    value={settings.smtpUser ?? ''}
                    onChange={(e) => setField('smtpUser', e.target.value)}
                    placeholder={t('settings.email.smtpUserPlaceholder', {
                      defaultValue: 'e.g. SMTP username or full email address',
                    })}
                  />
                </SettingsField>
                <SettingsField controlId="settings-smtp-pass" label={t('emailSettings.smtpPass')}>
                  <Input
                    id="settings-smtp-pass"
                    type="password"
                    value={settings.smtpPass ?? ''}
                    onChange={(e) => setField('smtpPass', e.target.value)}
                    placeholder="••••••••••••"
                  />
                </SettingsField>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
