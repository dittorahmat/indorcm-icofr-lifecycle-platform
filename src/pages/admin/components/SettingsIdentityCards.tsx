import { useTranslation } from 'react-i18next';
import { Building2, Image as ImageIcon, UserCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Settings } from '@shared/types';
import { SettingsField } from './SettingsField';
import type { SetSettingsField } from '../hooks/useSettingsDraft';

interface SettingsIdentityCardProps {
  settings: Settings;
  setField: SetSettingsField;
}

/** Organization metadata: name + logo, edited straight into the query cache. */
export function SettingsOrgProfileCard({ settings, setField }: SettingsIdentityCardProps) {
  const { t } = useTranslation('common');

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>{t('settings.org.title', { defaultValue: 'Organization Profile' })}</CardTitle>
            <CardDescription>
              {t('settings.org.description', {
                defaultValue: 'Official name and branding used in reports and BPM diagrams.',
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            controlId="settings-company-name"
            label={t('settings.org.companyName', { defaultValue: 'Company Name' })}
          >
            <Input
              id="settings-company-name"
              value={settings.companyName ?? ''}
              onChange={(e) => setField('companyName', e.target.value)}
              placeholder={t('settings.org.companyNamePlaceholder', {
                defaultValue: 'e.g. PT. Indonesia GRC Pro',
              })}
            />
          </SettingsField>

          <SettingsField
            controlId="settings-logo-url"
            label={t('settings.org.logoUrl', { defaultValue: 'Company Logo URL' })}
            hint={t('settings.org.logoHint', {
              defaultValue: 'Recommended: Transparent PNG, 200x200px',
            })}
          >
            <div className="flex gap-2 min-w-0">
              <Input
                id="settings-logo-url"
                value={settings.logoUrl ?? ''}
                onChange={(e) => setField('logoUrl', e.target.value)}
                placeholder={t('settings.org.logoUrlPlaceholder', {
                  defaultValue: 'https://example.com/logo.png',
                })}
                className="min-w-0 flex-1"
              />
              <div className="w-10 h-10 border rounded flex items-center justify-center bg-slate-50 shrink-0">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    className="w-8 h-8 object-contain"
                    alt={t('settings.org.logoPreviewAlt', { defaultValue: 'Logo preview' })}
                  />
                ) : (
                  <ImageIcon className="h-4 w-4 text-slate-300" />
                )}
              </div>
            </div>
          </SettingsField>
        </div>
      </CardContent>
    </Card>
  );
}

/** Default signatories written into Appendix 11 assessments. */
export function SettingsPersonnelCard({ settings, setField }: SettingsIdentityCardProps) {
  const { t } = useTranslation('common');

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
            <UserCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>
              {t('settings.personnel.title', { defaultValue: 'Authorized Personnel' })}
            </CardTitle>
            <CardDescription>
              {t('settings.personnel.description', {
                defaultValue: 'Default signatories for Appendix 11 and Management Assessments.',
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsField
            controlId="settings-ceo-name"
            label={t('settings.personnel.ceo', { defaultValue: 'Chief Executive Officer (CEO)' })}
          >
            <Input
              id="settings-ceo-name"
              value={settings.ceoName ?? ''}
              onChange={(e) => setField('ceoName', e.target.value)}
            />
          </SettingsField>

          <SettingsField
            controlId="settings-cfo-name"
            label={t('settings.personnel.cfo', { defaultValue: 'Chief Financial Officer (CFO)' })}
          >
            <Input
              id="settings-cfo-name"
              value={settings.cfoName ?? ''}
              onChange={(e) => setField('cfoName', e.target.value)}
            />
          </SettingsField>
        </div>
      </CardContent>
    </Card>
  );
}
