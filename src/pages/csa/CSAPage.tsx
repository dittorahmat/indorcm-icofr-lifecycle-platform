import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CSATabContent } from '@/components/bpm/CSATabContent';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function CSAPage() {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <AppLayout container={false} className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white border-b px-8 py-6 flex justify-between items-center shrink-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />
              Control Self Assessment Workspace
            </h1>
            <p className="text-sm text-muted-foreground italic">
              Lakukan pengujian mandiri dan sign-off secara berkala sesuai kebijakan ICOFR.
            </p>
          </div>
          
          <Alert className="max-w-md bg-indigo-50 border-indigo-100">
            <Info className="h-4 w-4 text-indigo-600" />
            <AlertTitle className="text-xs font-bold text-indigo-900 uppercase">Petunjuk</AlertTitle>
            <AlertDescription className="text-[11px] text-indigo-700">
              Pilih control dari daftar di bawah untuk memulai assessment. Gunakan biometrik/biometric auth untuk sign-off.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex-1 min-h-0 p-6 bg-slate-50/50">
          <CSATabContent standalone={true} />
        </div>
      </div>
    </AppLayout>
  );
}
