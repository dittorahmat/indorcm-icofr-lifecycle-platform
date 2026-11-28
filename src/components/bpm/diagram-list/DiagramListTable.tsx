import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { BPMProcessWithChildren } from '@shared/types';
import { ProcessRow } from './ProcessRow';
import { SubProcessRow } from './SubProcessRow';
import type { BPMDiagramListProps, RowCallbacks } from './diagram-list-types';

interface DiagramListTableProps {
  props: BPMDiagramListProps;
  callbacks: RowCallbacks;
  allSelected: boolean;
  onOpenDiagramFor: (proc: BPMProcessWithChildren) => void;
}

export function DiagramListTable({ props, callbacks, allSelected, onOpenDiagramFor }: DiagramListTableProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const {
    bpmLoading,
    hierarchicalProcesses,
    searchTerm,
    selectedProcessIds,
    selectedProcessId,
    expandedProcessIds,
    settings,
    selectedGLRow,
    onToggleSelectAll,
  } = props;

  return (
    <div className="hidden md:block overflow-x-auto max-w-full touch-pan-x overscroll-x-contain">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-center py-4">
              <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all" className="rounded" />
            </TableHead>
            <TableHead className="w-[110px] text-center font-semibold text-xs uppercase tracking-wider text-slate-500 py-3.5">
              {t('common:actions.title', 'Aksi')}
            </TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-slate-500 py-3.5">
              {t('bpm:table.processAndSubProcess', 'Proses & Sub-Proses')}
            </TableHead>
            <TableHead className="w-[130px] font-semibold text-xs uppercase tracking-wider text-slate-500 py-3.5">
              {t('bpm:table.level', 'Tingkatan')}
            </TableHead>
            <TableHead className="w-[140px] font-semibold text-xs uppercase tracking-wider text-slate-500 py-3.5">
              {t('bpm:table.company', 'Perusahaan')}
            </TableHead>
            <TableHead className="w-[100px] text-center font-semibold text-xs uppercase tracking-wider text-slate-500 py-3.5">
              {t('bpm:table.risks', 'Risiko')}
            </TableHead>
            <TableHead className="w-[100px] text-center font-semibold text-xs uppercase tracking-wider text-slate-500 py-3.5">
              {t('bpm:table.controls', 'Kontrol')}
            </TableHead>
            <TableHead className="w-[80px] text-center font-semibold text-xs uppercase tracking-wider text-slate-500 py-3.5">
              Status
            </TableHead>
            <TableHead className="w-[60px] py-4"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bpmLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="h-48 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('bpm:loading')}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : hierarchicalProcesses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-48 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                    <Info className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">
                    {searchTerm ? t('bpm:noProcessesFound', 'Tidak ada proses yang sesuai dengan pencarian') : t('bpm:noSubProcesses')}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            hierarchicalProcesses.map((process, i) => {
              const children = process.children ?? [];
              const hasChildren = children.length > 0;
              const isExpanded = expandedProcessIds.has(process.id);
              const isSelected = selectedProcessIds.includes(process.id);

              return (
                <React.Fragment key={process.id}>
                  <ProcessRow
                    process={process}
                    index={i}
                    isSelected={isSelected}
                    isExpanded={isExpanded}
                    isHighlighted={selectedProcessId === process.id}
                    childCount={children.length}
                    settings={settings}
                    selectedGLRow={selectedGLRow}
                    callbacks={callbacks}
                    onOpenDiagramFor={onOpenDiagramFor}
                  />
                  {hasChildren &&
                    isExpanded &&
                    children.map((sub) => (
                      <SubProcessRow
                        key={sub.id}
                        sub={sub}
                        isChildSelected={selectedProcessIds.includes(sub.id)}
                        isHighlighted={selectedProcessId === sub.id}
                        callbacks={callbacks}
                        onOpenDiagramFor={onOpenDiagramFor}
                      />
                    ))}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

