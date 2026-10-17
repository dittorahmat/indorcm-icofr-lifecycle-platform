import { useTranslation } from 'react-i18next';
import { Loader2, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useSettingsDraft } from './hooks/useSettingsDraft';
import { SettingsOrgProfileCard, SettingsPersonnelCard } from './components/SettingsIdentityCards';
import { SettingsEmailCard } from './components/SettingsEmailCard';
import { SettingsWebhooksCard } from './components/SettingsWebhooksCard';
import { SettingsCycleControlCard } from './components/SettingsCycleControlCard';

/**
 * Orchestrator only: it owns the draft seam (`useSettingsDraft` reads and writes
 * the `['settings']` query cache) and lays the section cards out. Every card is a
 * thin consumer of `(settings, setField)` — no section keeps its own copy of the
 * server state.
 */
export function SettingsPage() {
  const { t } = useTranslation('common');
  const { settings, setField, save, isSaving } = useSettingsDraft();

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <AppLayout container>
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 flex-wrap min-w-0 max-w-full">
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <h1 className="text-3xl font-bold tracking-tight truncate">
              {t('settings.title', { defaultValue: 'System Settings' })}
            </h1>
            <p className="text-muted-foreground">
              {t('settings.subtitle', {
                defaultValue: 'Manage organization metadata and regulatory configurations.',
              })}
            </p>
          </div>
          <Button
            onClick={save}
            disabled={isSaving}
            className="gap-2 shrink-0 w-full sm:w-auto min-h-[44px]"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('settings.saveChanges', { defaultValue: 'Save Global Changes' })}
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8">
          <SettingsOrgProfileCard settings={settings} setField={setField} />
          <SettingsPersonnelCard settings={settings} setField={setField} />
          <SettingsEmailCard settings={settings} setField={setField} />
          <SettingsWebhooksCard settings={settings} setField={setField} />
          <SettingsCycleControlCard settings={settings} setField={setField} />
        </div>
      </div>
    </AppLayout>
  );
}
