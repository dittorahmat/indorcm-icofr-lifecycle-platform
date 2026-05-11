import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MaterialitySimulation, SimulationStatus } from '@shared/types';

interface ScopingEditorHeaderProps {
  simState: MaterialitySimulation;
  isLocked: boolean;
  onBack: () => void;
  onSave: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isSubmitting: boolean;
  snapshotFilename?: string;
}

export function ScopingEditorHeader({
  simState,
  isLocked,
  onBack,
  onSave,
  onSubmit,
  isSaving,
  isSubmitting,
  snapshotFilename
}: ScopingEditorHeaderProps) {
  const { t } = useTranslation('scoping');

  return (
    <div className="flex justify-between items-center text-slate-900 dark:text-white">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{simState.name}</h1>
            <StatusBadge status={simState.status} />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-500" />
            Source: {snapshotFilename || 'Loading...'} | Basis: {simState.basis}
          </p>
        </div>
      </div>
      {!isLocked && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" /> {t('editor.saveDraft')}
          </Button>
          <Button onClick={onSubmit} className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" /> {simState.status === 'Rejected' ? t('editor.resubmitToCfo') : t('editor.submitToCfo')}
          </Button>
        </div>
      )}
      {simState.status === 'Approved' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" /> {t('editor.lockedMessage')}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SimulationStatus }) {
  const { t } = useTranslation('scoping');
  switch (status) {
    case 'Approved': return <Badge className="bg-green-600">{t('status.approved')}</Badge>;
    case 'Pending CFO': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">{t('status.pendingCfo')}</Badge>;
    case 'Pending Komut': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">{t('status.pendingKomut')}</Badge>;
    case 'Rejected': return <Badge variant="destructive">{t('status.rejected')}</Badge>;
    default: return <Badge variant="outline">{t('status.draft')}</Badge>;
  }
}
