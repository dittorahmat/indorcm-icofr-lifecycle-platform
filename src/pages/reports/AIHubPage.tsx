import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIAnalyticsMockup } from '@/components/reports/AIAnalyticsMockup';
import { BrainCircuit } from 'lucide-react';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';
import { useTranslation } from 'react-i18next';

export function AIHubPage() {
  const { companyName } = useOrganizationBranding();
  const { t } = useTranslation('reports');

  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 bg-sky-100 rounded-lg text-sky-700 shadow-sm border border-sky-200 self-start shrink-0">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900 break-words">{companyName} — AI Analytics Center</h1>
            <p className="text-muted-foreground break-words">{t('aiHub.pageSubtitle')}</p>
          </div>
        </div>

        <AIAnalyticsMockup />
      </div>
    </AppLayout>
  );
}

