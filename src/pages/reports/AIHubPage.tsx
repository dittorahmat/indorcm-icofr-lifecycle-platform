import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIAnalyticsMockup } from '@/components/reports/AIAnalyticsMockup';
import { BrainCircuit } from 'lucide-react';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';

export function AIHubPage() {
  const { companyName } = useOrganizationBranding();

  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-100 rounded-lg text-sky-700 shadow-sm border border-sky-200">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">{companyName} — AI Analytics Center</h1>
            <p className="text-muted-foreground">Modern digital audit capabilities for enterprise control monitoring.</p>
          </div>
        </div>

        <AIAnalyticsMockup />
      </div>
    </AppLayout>
  );
}

