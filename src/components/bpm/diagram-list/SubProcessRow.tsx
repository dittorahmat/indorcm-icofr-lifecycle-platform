import { useTranslation } from 'react-i18next';
import { CornerDownRight, FileSpreadsheet, Map, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { BPMProcess } from '@shared/types';
import { DiagramActionButton } from './DiagramActionButton';
import type { RowCallbacks } from './diagram-list-types';

interface SubProcessRowProps {
  sub: BPMProcess;
  isChildSelected: boolean;
  isHighlighted: boolean;
  callbacks: RowCallbacks;
  onOpenDiagramFor: (proc: BPMProcess) => void;
}

export function SubProcessRow({ sub, isChildSelected, isHighlighted, callbacks, onOpenDiagramFor }: SubProcessRowProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <TableRow
      className={cn(
        'group cursor-pointer transition-colors bg-slate-50/40 hover:bg-indigo-50/30',
        isChildSelected && 'bg-indigo-50/40',
        isHighlighted && 'bg-indigo-100/50',
      )}
      onClick={() => callbacks.onSelectProcess?.(sub)}
    >
      <TableCell className="py-3 text-center px-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isChildSelected}
          onCheckedChange={() => callbacks.onToggleSelect(sub.id)}
          aria-label={`Select ${sub.name}`}
          className="rounded ml-2"
        />
      </TableCell>

      <TableCell className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-1.5">
          <DiagramActionButton
            icon={<Map className="h-4 w-4" />}
            tooltipKey="bpm:tooltips.openMicroDiagram"
            fallback="Buka Diagram Alir BPMN Mikro"
            tone="indigo"
            onClick={() => onOpenDiagramFor(sub)}
          />
          <DiagramActionButton
            icon={<FileSpreadsheet className="h-4 w-4" />}
            tooltipKey="bpm:tooltips.openWorksheet"
            fallback="Buka RCM Worksheet"
            tone="emerald"
            onClick={() => callbacks.onOpenWorksheet(sub.id, sub.name)}
          />
        </div>
      </TableCell>

      <TableCell className="py-3">
        <div className="flex items-center pl-7 relative">
          <CornerDownRight className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800 text-xs group-hover:text-indigo-600 transition-colors">{sub.name}</span>
              {sub.bpmCode && (
                <Badge variant="outline" className="h-4 px-1 text-xs font-mono font-bold bg-white text-slate-600 border-slate-200 shrink-0">
                  {sub.bpmCode}
                </Badge>
              )}
            </div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {sub.id.substring(0, 8)}</span>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-3">
        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-semibold text-xs uppercase tracking-wider px-2 py-0.5 rounded-md">
          {t('bpm:hierarchy.subProcess', 'Sub-Proses')}
        </Badge>
      </TableCell>

      <TableCell className="py-3">
        <span className="text-xs font-medium text-slate-400">—</span>
      </TableCell>

      <TableCell className="text-center py-3">
        <span className="text-xs font-semibold text-orange-600">{sub.riskCount || 0}</span>
      </TableCell>

      <TableCell className="text-center py-3">
        <span className="text-xs font-semibold text-emerald-600">{sub.controlCount || 0}</span>
      </TableCell>

      <TableCell className="text-center py-3">
        <Badge variant="outline" className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded text-slate-400 border-slate-200">
          {sub.workflowStatus || 'Draft'}
        </Badge>
      </TableCell>

      <TableCell className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
          onClick={() => callbacks.onDeleteProcess(sub.id, sub.name)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
