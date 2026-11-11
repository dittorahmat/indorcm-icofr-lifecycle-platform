import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Star, Link as LinkIcon, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import type { RCMMatrixItem } from './useRCMExplorer';

interface RCMControlDetailModalProps {
  item: RCMMatrixItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RCMControlDetailModal({ item, isOpen, onClose }: RCMControlDetailModalProps) {
  const { t } = useTranslation('rcm');

  if (!item) return null;

  const isKey = Boolean(item.isKeyControl);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 bg-surface-container-lowest">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container text-foreground border border-border/80">
              {item.controlCode || 'C-CTRL'}
            </span>
            {isKey && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-xs">
                <Star className="h-3 w-3 text-amber-600 fill-amber-500" />
                KEY CONTROL
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded bg-surface-container font-semibold text-primary">
              {item.controlType || 'Preventive'}
            </span>
          </div>
          <DialogTitle className="font-display text-base sm:text-lg text-primary font-bold leading-snug">
            {item.mappedControlName || item.baseControlName || 'Detail Aktivitas Pengendalian'}
          </DialogTitle>
          <DialogDescription className="text-xs text-on-surface-variant">
            {t('explorer.detail.dialogDesc', {
              defaultValue: 'Informasi lengkap tata kelola, mitigasi risiko, dan kepatuhan 6 pilar TOD BUMN.',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Risk Information */}
          <div className="p-3 bg-surface-container-low rounded-lg space-y-1.5 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {t('explorer.detail.riskTitle', { defaultValue: 'Titik Risiko Terkait' })}
              </span>
              <span className="font-mono text-xs text-slate-500">{item.rcmId || 'R-ICOFR'}</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              {item.riskDescription || '-'}
            </p>
          </div>

          {/* Control Activity Description */}
          <div className="space-y-1">
            <span className="font-bold text-primary">
              {t('explorer.detail.activityTitle', { defaultValue: 'Deskripsi Pelaksanaan Pengendalian' })}
            </span>
            <p className="p-3 bg-slate-50 rounded-lg text-slate-700 leading-relaxed border border-slate-100">
              {item.mappedControlDescription || item.baseControlDescription || '-'}
            </p>
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-0.5">
              <span className="text-on-surface-variant text-xs">Proses / Sub-Proses</span>
              <p className="font-semibold text-primary">{item.processName || '-'} / {item.subProcessName || '-'}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-on-surface-variant text-xs">Akun Signifikan (FSLI)</span>
              <p className="font-semibold text-primary">{item.fsliName || '-'} (GL: {item.noGL || '-'})</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-on-surface-variant text-xs">Pelaksana / PIC</span>
              <p className="font-semibold text-primary">{item.executorRole || item.executingFunction || '-'}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-on-surface-variant text-xs">Frekuensi & Sifat</span>
              <p className="font-semibold text-primary">{item.frequency || 'Bulanan'} • {item.controlNature || 'Manual'}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-on-surface-variant text-xs">Aplikasi Pendukung</span>
              <p className="font-semibold text-primary">{item.supportingApp || item.itApplication || 'ERP Standard'}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-on-surface-variant text-xs">Simpul BPM Terkait</span>
              <p className="font-mono font-semibold text-secondary">{item.nodeId || item.bpmCode || '-'}</p>
            </div>
          </div>

          {/* 6 Pilar TOD Status Grid */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="font-bold text-primary flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
              {t('explorer.detail.sixPillarsTitle', { defaultValue: 'Evaluasi 6 Pilar TOD (Lampiran 8)' })}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <PillarBadge label={t('verification.columns.p_obj')} value={item.pilarObjective} />
              <PillarBadge label={t('verification.columns.p_time')} value={item.pilarTiming} />
              <PillarBadge label={t('verification.columns.p_auth')} value={item.pilarAuthority} />
              <PillarBadge label={t('verification.columns.p_rel')} value={item.pilarReliability} />
              <PillarBadge label={t('verification.columns.p_cov')} value={item.pilarCoverage} />
              <PillarBadge label={t('verification.columns.p_evid')} value={item.pilarEvidence} />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 px-4">
            {t('common:actions.close', { defaultValue: 'Tutup' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PillarBadge({ label, value }: { label: string; value?: string | null }) {
  const isSatisfied = Boolean(value && value.trim().length > 0);
  return (
    <div className="p-2 rounded bg-surface-container-low border border-slate-100 flex flex-col justify-between">
      <span className="text-xs text-on-surface-variant truncate">{label}</span>
      <div className="flex items-center gap-1 mt-1">
        {isSatisfied ? (
          <CheckCircle className="h-3 w-3 text-secondary shrink-0" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
        )}
        <span className={`text-xs font-bold ${isSatisfied ? 'text-secondary' : 'text-slate-400'}`}>
          {isSatisfied ? 'Terpenuhi' : 'Belum Ada'}
        </span>
      </div>
    </div>
  );
}
