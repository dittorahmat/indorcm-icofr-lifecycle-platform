import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ExternalLink, Star, CheckCircle, AlertCircle, Eye, ShieldCheck, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RCMMatrixItem } from './useRCMExplorer';

interface RCMKeyControlTableProps {
  items: RCMMatrixItem[];
  isLoading: boolean;
  onViewDetail?: (item: RCMMatrixItem) => void;
}

export function RCMKeyControlTable({ items, isLoading, onViewDetail }: RCMKeyControlTableProps) {
  const { t } = useTranslation('rcm');

  return (
    <div className="w-full overflow-x-auto max-w-full touch-pan-x overscroll-x-contain rounded-xl border border-slate-200 bg-surface-container-lowest shadow-sm">
      <table className="w-full text-left min-w-[1280px] border-collapse">
        <thead>
          <tr className="bg-surface-container text-on-surface-variant font-bold text-xs uppercase tracking-wider border-b border-slate-200">
            <th className="py-3 px-4 w-44">{t('explorer.table.riskId', { defaultValue: 'ID & Risiko' })}</th>
            <th className="py-3 px-4 w-36">{t('explorer.table.fsli', { defaultValue: 'Akun Signifikan (FSLI)' })}</th>
            <th className="py-3 px-4 w-40">{t('explorer.table.controlId', { defaultValue: 'ID Kontrol & Status' })}</th>
            <th className="py-3 px-4">{t('explorer.table.controlActivity', { defaultValue: 'Aktivitas Pengendalian' })}</th>
            <th className="py-3 px-4 w-40">{t('explorer.table.processSub', { defaultValue: 'Proses & Subproses' })}</th>
            <th className="py-3 px-4 w-36">{t('explorer.table.typeNature', { defaultValue: 'Tipe & Sifat' })}</th>
            <th className="py-3 px-4 w-32">{t('explorer.table.automation', { defaultValue: 'Automasi & App' })}</th>
            <th className="py-3 px-4 w-32 text-center">{t('explorer.table.bpmNode', { defaultValue: 'Simpul BPM' })}</th>
            <th className="py-3 px-4 w-28 text-center">{t('explorer.table.designStatus', { defaultValue: 'Status TOD' })}</th>
            <th className="py-3 px-4 w-20 text-center">{t('explorer.table.action', { defaultValue: 'Aksi' })}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-on-surface text-xs font-normal">
          {isLoading ? (
            <tr>
              <td colSpan={10} className="py-16 text-center text-slate-400 font-medium">
                {t('common:status.pending', { defaultValue: 'Memuat data matriks...' })}
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-16 text-center text-slate-400">
                {t('common:status.noData', { defaultValue: 'Tidak ada data pengendalian yang cocok dengan kriteria filter.' })}
              </td>
            </tr>
          ) : (
            items.map((item, idx) => {
              const isKey = Boolean(item.isKeyControl);
              const riskRating = item.riskRating || 'Medium';
              const isHigh = riskRating.toLowerCase() === 'high';
              const bpmCode = item.parentBpmCode || item.bpmCode;
              const hasBpmLink = Boolean(item.diagramId || item.nodeId);
              const bpmTarget = `/rcm/bpm?diagramId=${encodeURIComponent(item.diagramId || '')}${
                item.nodeId ? `&nodeId=${encodeURIComponent(item.nodeId)}` : ''
              }`;

              return (
                <tr
                  key={item.mappingId || `${item.controlId}-${idx}`}
                  className="hover:bg-surface-container-low/60 transition-colors"
                >
                  {/* ID & Risk */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-bold text-primary">
                        {item.rcmId || 'R-ICOFR'}
                      </span>
                      <span
                        className={cn(
                          'w-fit text-[10px] font-bold px-1.5 py-0.5 rounded',
                          isHigh
                            ? 'bg-rose-100 text-rose-800'
                            : riskRating.toLowerCase() === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        )}
                      >
                        {riskRating.toUpperCase()} RISK
                      </span>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 leading-snug">
                        {item.riskDescription || '-'}
                      </p>
                    </div>
                  </td>

                  {/* FSLI Account */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-primary line-clamp-2">
                        {item.fsliName || item.affectedFsliItem || '-'}
                      </span>
                      {item.noGL && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-slate-600 w-fit">
                          GL {item.noGL}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Control ID & Key status */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-bold text-primary">
                        {item.controlCode || 'C-CTRL'}
                      </span>
                      {isKey ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] w-fit shadow-2xs">
                          <Star className="h-3 w-3 text-amber-600 fill-amber-500" />
                          KEY CONTROL
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Non-Key</span>
                      )}
                    </div>
                  </td>

                  {/* Control Activity */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-primary leading-snug">
                        {item.mappedControlName || item.baseControlName || '-'}
                      </span>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                        {item.mappedControlDescription || item.baseControlDescription || '-'}
                      </p>
                      {item.executorRole && (
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          PIC: <span className="font-medium text-slate-700">{item.executorRole}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Process & Subprocess */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-900">
                        {item.processName || item.parentProcessName || '-'}
                      </span>
                      <span className="text-[11px] text-on-surface-variant line-clamp-2">
                        {item.subProcessName || '-'}
                      </span>
                    </div>
                  </td>

                  {/* Type & Nature */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <span
                        className={cn(
                          'font-semibold',
                          item.controlType?.toLowerCase() === 'preventive' ? 'text-secondary' : 'text-primary'
                        )}
                      >
                        {item.controlType || 'Preventive'}
                      </span>
                      <span className="text-on-surface-variant">
                        {item.controlNature || 'Manual'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {item.frequency || 'Monthly'}
                      </span>
                    </div>
                  </td>

                  {/* Automation & App */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[11px] font-semibold text-primary px-1.5 py-0.5 rounded bg-surface-container w-fit">
                        {item.supportingApp || item.itApplication || 'ERP / Core'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.automatedSubNature || 'Automated Logic'}
                      </span>
                    </div>
                  </td>

                  {/* BPM Node Linkage */}
                  <td className="py-3 px-4 align-top text-center">
                    {hasBpmLink ? (
                      <Link
                        to={bpmTarget}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-secondary bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 px-2 py-1 rounded transition-colors"
                        title={t('explorer.table.openBpmTooltip', { defaultValue: 'Buka Simpul BPM' })}
                      >
                        <span>{item.nodeId ? (item.nodeId.length > 12 ? 'BPM Node' : item.nodeId) : (bpmCode || 'BPM')}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">-</span>
                    )}
                  </td>

                  {/* TOD Design Status */}
                  <td className="py-3 px-4 align-top text-center">
                    {item.conclusion === 'Effective' || !item.conclusion ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold text-[10px]">
                        <CheckCircle className="h-3 w-3" />
                        EFFECTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                        <AlertCircle className="h-3 w-3" />
                        INEFFECTIVE
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 align-top text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail?.(item)}
                      className="h-8 w-8 p-0 rounded hover:bg-surface-container text-primary"
                      title={t('explorer.table.viewDetail', { defaultValue: 'Lihat Detail & Audit Trail' })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
