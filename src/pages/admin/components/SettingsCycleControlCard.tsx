import { useTranslation } from 'react-i18next';
import { CalendarDays, Lock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { Settings } from '@shared/types';
import { SettingsField } from './SettingsField';
import type { SetSettingsField } from '../hooks/useSettingsDraft';

interface SettingsCycleControlCardProps {
  settings: Settings;
  setField: SetSettingsField;
}

/** Global fiscal-year + period lock controls (critical: they gate every edit surface). */
export function SettingsCycleControlCard({ settings, setField }: SettingsCycleControlCardProps) {
  const { t } = useTranslation('common');
  const isLocked = settings.isPeriodLocked === true;

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-rose-500">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle>
                {t('settings.cycle.title', { defaultValue: 'Compliance Cycle Control' })}
              </CardTitle>
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {t('settings.cycle.critical', { defaultValue: 'Critical' })}
              </Badge>
            </div>
            <CardDescription>
              {t('settings.cycle.description', {
                defaultValue: 'Manage global fiscal year and period locking.',
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-rose-50/50 rounded-lg border border-rose-100 min-w-0">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-bold text-rose-900 flex items-center gap-2">
              {isLocked ? (
                <Lock className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
              )}
              {t('settings.cycle.periodStatus', { defaultValue: 'Period Status:' })}{' '}
              {isLocked
                ? t('settings.cycle.locked', { defaultValue: 'LOCKED' })
                : t('settings.cycle.open', { defaultValue: 'OPEN' })}
            </p>
            <p className="text-xs text-rose-700">
              {t('settings.cycle.lockedHint', {
                defaultValue:
                  'When locked, all RCM, Scoping, and Diagram edits are disabled system-wide.',
              })}
            </p>
          </div>
          <Switch
            checked={isLocked}
            onCheckedChange={(value) => setField('isPeriodLocked', value)}
            aria-label={t('settings.cycle.lockToggle', { defaultValue: 'Lock compliance period' })}
            className="shrink-0 self-start sm:self-center"
          />
        </div>

        <div className="max-w-[200px]">
          <SettingsField
            controlId="settings-fiscal-year"
            label={t('settings.cycle.fiscalYear', { defaultValue: 'Global Fiscal Year' })}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
              <Input
                id="settings-fiscal-year"
                type="number"
                value={settings.fiscalYear ?? 2026}
                onChange={(e) => setField('fiscalYear', Number.parseInt(e.target.value, 10) || 2026)}
                className="font-bold"
              />
            </div>
          </SettingsField>
        </div>
      </CardContent>
    </Card>
  );
}
