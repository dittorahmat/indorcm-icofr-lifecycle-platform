import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIAnalyticsMockup } from '@/components/reports/AIAnalyticsMockup';
import { BrainCircuit } from 'lucide-react';

export function AIHubPage() {
  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI & Analytics Center</h1>
            <p className="text-muted-foreground">Modern digital audit capabilities for enterprise control monitoring.</p>
          </div>
        </div>

        <AIAnalyticsMockup />
      </div>
    </AppLayout>
  );
}
