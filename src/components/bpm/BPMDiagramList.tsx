import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileSpreadsheet,
  Trash2,
  Loader2,
  Info,
  Map,
  Activity,
  ChevronRight,
  ChevronDown,
  GitMerge,
  Maximize2,
  Minimize2,
  CornerDownRight,
  Workflow,
} from 'lucide-react';
import { BPMProcess, BPMProcessWithChildren, BPMDiagram, Settings, GLRow } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BPMDiagramListProps {
  bpmLoading: boolean;
  hierarchicalProcesses: BPMProcessWithChildren[];
  diagrams?: { items: BPMDiagram[] };
  settings?: Settings;
  selectedGLRow?: GLRow | null;
  selectedProcessId?: string | null;
  onSelectProcess?: (bpm: BPMProcess) => void;
  onOpenDiagram: (diagramId: string, subProcess: string, bpmProcessId?: string) => void;
  onCreateDiagram: (subProcess: string) => void;
  onOpenWorksheet: (bpmId: string, bpmName: string) => void;
  onDeleteProcess: (bpmId: string, bpmName: string) => void;
  searchTerm: string;

  // Hierarchical & Batch Actions
  selectedProcessIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  expandedProcessIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenMigrationModal: () => void;
}

export function BPMDiagramList({
  bpmLoading,
  hierarchicalProcesses,
  diagrams,
  settings,
  selectedGLRow,
  selectedProcessId,
  onSelectProcess,
  onOpenDiagram,
  onCreateDiagram,
  onOpenWorksheet,
  onDeleteProcess,
  searchTerm,

  selectedProcessIds,
  onToggleSelect,
  onToggleSelectAll,
  expandedProcessIds,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onOpenMigrationModal,
}: BPMDiagramListProps) {
  const { t } = useTranslation(['bpm', 'common']);

  // Flattened count of all processes (root + children)
  const totalProcessesCount = React.useMemo(() => {
    let count = 0;
    hierarchicalProcesses.forEach((root) => {
      count += 1;
      if (root.children) count += root.children.length;
    });
    return count;
  }, [hierarchicalProcesses]);

  const allSelected =
    totalProcessesCount > 0 && selectedProcessIds.length === totalProcessesCount;

  return (
    <div className="border border-slate-200 rounded-[2.5rem] bg-white shadow-xl shadow-slate-100 overflow-hidden flex flex-col">
      {/* Top Toolbar: Batch Actions & Expand/Collapse All */}
      <div className="bg-slate-50/70 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onExpandAll}
            className="h-8 gap-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            <Maximize2 className="h-3.5 w-3.5 text-indigo-500" />
            {t('bpm:hierarchy.expandAll', 'Buka Semua')}
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCollapseAll}
            className="h-8 gap-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            <Minimize2 className="h-3.5 w-3.5 text-slate-400" />
            {t('bpm:hierarchy.collapseAll', 'Tutup Semua')}
          </Button>
        </div>

        {selectedProcessIds.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50/80 px-3 py-1 rounded-xl border border-indigo-200/60 shadow-sm animate-in fade-in">
            <span className="text-[11px] font-bold text-indigo-900">
              {t('bpm:migration.selectedCount', {
                count: selectedProcessIds.length,
                defaultValue: `${selectedProcessIds.length} item dipilih`,
              })}
            </span>
            <Button
              size="sm"
              onClick={onOpenMigrationModal}
              className="h-7 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg px-2.5 shadow-sm"
            >
              <GitMerge className="h-3 w-3" />
              {t('bpm:migration.openModalButton', 'Atur Hierarki / Migrasi')}
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[50px] text-center py-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Select all"
                  className="rounded"
                />
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {t('bpm:loading')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : hierarchicalProcesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                      <Info className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium italic">
                      {searchTerm ? t('bpm:noProcessesFound', 'Tidak ada proses yang sesuai dengan pencarian') : t('bpm:noSubProcesses')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              hierarchicalProcesses.map((process, i) => {
                const hasChildren = (process.children && process.children.length > 0) || false;
                const isExpanded = expandedProcessIds.has(process.id);
                const isSelected = selectedProcessIds.includes(process.id);

                return (
                  <React.Fragment key={process.id}>
                    {/* Parent Process Row */}
                    <TableRow
                      className={cn(
                        'group cursor-pointer transition-colors',
                        i % 2 === 1 && 'bg-slate-50/20',
                        selectedProcessId === process.id
                          ? 'bg-indigo-50/50 hover:bg-indigo-50'
                          : 'hover:bg-slate-50/80',
                        isSelected && 'bg-indigo-50/30'
                      )}
                      onClick={() => onSelectProcess?.(process)}
                    >
                      {/* Checkbox */}
                      <TableCell className="py-4 text-center px-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelect(process.id)}
                          aria-label={`Select ${process.name}`}
                          className="rounded"
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-4 px-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-indigo-600 hover:bg-indigo-100/60 rounded-xl transition-all"
                                  onClick={() => {
                                    const diagram = diagrams?.items.find(
                                      (d) => d.subProcess === process.name || d.name === process.name
                                    );
                                    if (diagram) onOpenDiagram(diagram.id, process.name, process.id);
                                    else onCreateDiagram(process.name);
                                  }}
                                >
                                  <Workflow className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-mancity-pattern text-primary-foreground border-none rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">
                                {t('bpm:tooltips.openMacroDiagram', 'Buka Diagram Makro Proses')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Quick Worksheet on parent if no children */}
                          {!hasChildren && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                    onClick={() => onOpenWorksheet(process.id, process.name)}
                                  >
                                    <FileSpreadsheet className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-mancity-pattern text-primary-foreground border-none rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">
                                  {t('bpm:tooltips.openWorksheet', 'Buka RCM Worksheet')}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>

                      {/* Process Name with Expand Toggle */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2.5">
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand(process.id);
                              }}
                              className="h-6 w-6 rounded-md hover:bg-slate-200/60 flex items-center justify-center transition-transform text-slate-500 hover:text-slate-900"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-indigo-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
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
                                <Badge className="h-4 px-1.5 text-[9px] bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none font-bold tracking-widest rounded-md shrink-0">
                                  {process.bpmCode}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Activity className="h-2.5 w-2.5" /> ID: {process.id.substring(0, 8)}
                              </span>
                              {hasChildren && (
                                <span className="text-[10px] text-indigo-600 font-bold">
                                  • {process.children!.length} {t('bpm:hierarchy.subProcessesCount', 'sub-proses')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Level Badge */}
                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className="bg-indigo-50/80 text-indigo-700 border-indigo-200 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md"
                        >
                          {t('bpm:hierarchy.macroProcess', 'Proses Bisnis')}
                        </Badge>
                      </TableCell>

                      {/* Company & Entity */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[120px]">
                            {settings?.companyName || 'PT BUMN SEJAHTERA'}
                          </span>
                          <Badge variant="outline" className="font-mono text-[9px] font-bold bg-slate-50 text-slate-500 px-1.5 h-4 rounded">
                            {selectedGLRow?.entityCode || 'ENT-01'}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Risks (Rollup) */}
                      <TableCell className="text-center py-4">
                        <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[10px] h-6 px-2.5 rounded-lg shadow-sm">
                          {process.riskCount || 0} RISKS
                        </Badge>
                      </TableCell>

                      {/* Controls (Rollup) */}
                      <TableCell className="text-center py-4">
                        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px] h-6 px-2.5 rounded-lg shadow-sm">
                          {process.controlCount || 0} CONTROLS
                        </Badge>
                      </TableCell>

                      {/* Workflow Status */}
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md border-slate-200 text-slate-500">
                          {process.workflowStatus || 'Draft'}
                        </Badge>
                      </TableCell>

                      {/* Delete */}
                      <TableCell className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                          onClick={() => onDeleteProcess(process.id, process.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Sub-Processes Nested Rows */}
                    {hasChildren &&
                      isExpanded &&
                      process.children!.map((sub, childIdx) => {
                        const isChildSelected = selectedProcessIds.includes(sub.id);

                        return (
                          <TableRow
                            key={sub.id}
                            className={cn(
                              'group cursor-pointer transition-colors bg-slate-50/40 hover:bg-indigo-50/30',
                              isChildSelected && 'bg-indigo-50/40',
                              selectedProcessId === sub.id && 'bg-indigo-100/50'
                            )}
                            onClick={() => onSelectProcess?.(sub)}
                          >
                            {/* Checkbox */}
                            <TableCell className="py-3 text-center px-2" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isChildSelected}
                                onCheckedChange={() => onToggleSelect(sub.id)}
                                aria-label={`Select ${sub.name}`}
                                className="rounded ml-2"
                              />
                            </TableCell>

                            {/* Actions for Sub-Process */}
                            <TableCell className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        onClick={() => {
                                          const diagram = diagrams?.items.find(
                                            (d) => d.subProcess === sub.name || d.name === sub.name
                                          );
                                          if (diagram) onOpenDiagram(diagram.id, sub.name, sub.id);
                                          else onCreateDiagram(sub.name);
                                        }}
                                      >
                                        <Map className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-mancity-pattern text-primary-foreground border-none rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">
                                      {t('bpm:tooltips.openMicroDiagram', 'Buka Diagram Alir BPMN Mikro')}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                        onClick={() => onOpenWorksheet(sub.id, sub.name)}
                                      >
                                        <FileSpreadsheet className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-mancity-pattern text-primary-foreground border-none rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">
                                      {t('bpm:tooltips.openWorksheet', 'Buka RCM Worksheet')}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>

                            {/* Sub-Process Name with Tree Guide Indentation */}
                            <TableCell className="py-3">
                              <div className="flex items-center pl-7 relative">
                                <CornerDownRight className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800 text-xs group-hover:text-indigo-600 transition-colors">
                                      {sub.name}
                                    </span>
                                    {sub.bpmCode && (
                                      <Badge variant="outline" className="h-4 px-1 text-[8px] font-mono font-bold bg-white text-slate-600 border-slate-200 shrink-0">
                                        {sub.bpmCode}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                    ID: {sub.id.substring(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Level Badge */}
                            <TableCell className="py-3">
                              <Badge
                                variant="outline"
                                className="bg-slate-100 text-slate-600 border-slate-200 font-semibold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md"
                              >
                                {t('bpm:hierarchy.subProcess', 'Sub-Proses')}
                              </Badge>
                            </TableCell>

                            {/* Company */}
                            <TableCell className="py-3">
                              <span className="text-[10px] font-medium text-slate-400">
                                —
                              </span>
                            </TableCell>

                            {/* Risks */}
                            <TableCell className="text-center py-3">
                              <span className="text-xs font-semibold text-orange-600">
                                {sub.riskCount || 0}
                              </span>
                            </TableCell>

                            {/* Controls */}
                            <TableCell className="text-center py-3">
                              <span className="text-xs font-semibold text-emerald-600">
                                {sub.controlCount || 0}
                              </span>
                            </TableCell>

                            {/* Status */}
                            <TableCell className="text-center py-3">
                              <Badge variant="outline" className="text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded text-slate-400 border-slate-200">
                                {sub.workflowStatus || 'Draft'}
                              </Badge>
                            </TableCell>

                            {/* Delete */}
                            <TableCell className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                onClick={() => onDeleteProcess(sub.id, sub.name)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
