import { useTranslation } from 'react-i18next';
import { Activity, ChevronDown, ChevronRight, FileSpreadsheet, Trash2, Workflow } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { BPMProcessWithChildren, GLRow, Settings } from '@shared/types';
import { DiagramActionButton } from './DiagramActionButton';
import type { RowCallbacks } from './diagram-list-types';

interface ProcessRowProps {
  process: BPMProcessWithChildren;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  isHighlighted: boolean;
  childCount: number;
  settings?: Settings;
  selectedGLRow?: GLRow | null;
  callbacks: RowCallbacks;
  onOpenDiagramFor: (proc: BPMProcessWithChildren) => void;
}

export function ProcessRow({
  process,
  index,
  isSelected,
  isExpanded,
  isHighlighted,
  childCount,
  settings,
  selectedGLRow,
  callbacks,
  onOpenDiagramFor,
}: ProcessRowProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const hasChildren = childCount > 0;

  return (
    <TableRow
      className={cn(
        'group cursor-pointer transition-colors',
        index % 2 === 1 && 'bg-slate-50/20',
        isHighlighted ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50/80',
        isSelected && 'bg-indigo-50/30',
      )}
      onClick={() => callbacks.onSelectProcess?.(process)}
    >
      <TableCell className="py-4 text-center px-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => callbacks.onToggleSelect(process.id)}
          aria-label={`Select ${process.name}`}
          className="rounded"
        />
      </TableCell>

      <TableCell className="py-4 px-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1.5">
          <DiagramActionButton
            icon={<Workflow className="h-4 w-4" />}
            tooltipKey="bpm:tooltips.openMacroDiagram"
            fallback="Buka Diagram Makro Proses"
            tone="indigo"
            onClick={() => onOpenDiagramFor(process)}
          />
          {!hasChildren && (
            <DiagramActionButton
              icon={<FileSpreadsheet className="h-4 w-4" />}
              tooltipKey="bpm:tooltips.openWorksheet"
              fallback="Buka RCM Worksheet"
              tone="emerald"
              onClick={() => callbacks.onOpenWorksheet(process.id, process.name)}
            />
          )}
        </div>
      </TableCell>

      <TableCell className="py-4">
        <div className="flex items-center gap-2.5">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                callbacks.onToggleExpand(process.id);
              }}
              className="h-6 w-6 rounded-md hover:bg-slate-200/60 flex items-center justify-center transition-transform text-slate-500 hover:text-slate-900"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4 text-indigo-600" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="h-6 w-6 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-slate-900 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">
                {process.name}
              </span>
              {process.bpmCode && (
                <Badge className="h-4 px-1.5 text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none font-bold tracking-widest rounded-md shrink-0">
                  {process.bpmCode}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Activity className="h-2.5 w-2.5" /> ID: {process.id.substring(0, 8)}
              </span>
              {hasChildren && (
                <span className="text-xs text-indigo-600 font-bold">
                  • {childCount} {t('bpm:hierarchy.subProcessesCount', 'sub-proses')}
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-4">
        <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700 border-indigo-200 font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded-md">
          {t('bpm:hierarchy.macroProcess', 'Proses Bisnis')}
        </Badge>
      </TableCell>

      <TableCell className="py-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate max-w-[120px]">
            {settings?.companyName || 'PT BUMN SEJAHTERA'}
          </span>
          <Badge variant="outline" className="font-mono text-xs font-bold bg-slate-50 text-slate-500 px-1.5 h-4 rounded">
            {selectedGLRow?.entityCode || 'ENT-01'}
          </Badge>
        </div>
      </TableCell>

      <TableCell className="text-center py-4">
        <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-xs h-6 px-2.5 rounded-lg shadow-sm">
          {process.riskCount || 0} RISKS
        </Badge>
      </TableCell>

      <TableCell className="text-center py-4">
        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-xs h-6 px-2.5 rounded-lg shadow-sm">
          {process.controlCount || 0} CONTROLS
        </Badge>
      </TableCell>

      <TableCell className="text-center py-4">
        <Badge variant="outline" className="text-xs font-black uppercase tracking-tight px-2 py-0.5 rounded-md border-slate-200 text-slate-500">
          {process.workflowStatus || 'Draft'}
        </Badge>
      </TableCell>

      <TableCell className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-all rounded-lg shrink-0"
          onClick={() => callbacks.onDeleteProcess(process.id, process.name)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
