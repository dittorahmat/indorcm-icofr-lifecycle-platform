import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Edit2, FileSpreadsheet, Trash2, ShieldCheck, Loader2, Info,
  Map, Activity, Shield, ChevronRight, MoreHorizontal
} from 'lucide-react';
import { BPMProcess, BPMDiagram, Settings, GLRow } from '@shared/types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BPMDiagramListProps {
  bpmLoading: boolean;
  filteredBpmProcesses: BPMProcess[];
  diagrams?: { items: BPMDiagram[] };
  settings?: Settings;
  selectedGLRow?: GLRow | null;
  onOpenDiagram: (diagramId: string, subProcess: string) => void;
  onCreateDiagram: (subProcess: string) => void;
  onOpenWorksheet: (bpmId: string, bpmName: string) => void;
  onDeleteProcess: (bpmId: string, bpmName: string) => void;
  onSelectProcess?: (bpm: BPMProcess) => void;
  selectedProcessId?: string | null;
  searchTerm: string;
}

export function BPMDiagramList({
  bpmLoading,
  filteredBpmProcesses,
  diagrams,
  settings,
  selectedGLRow,
  onOpenDiagram,
  onCreateDiagram,
  onOpenWorksheet,
  onDeleteProcess,
  onSelectProcess,
  selectedProcessId,
  searchTerm
}: BPMDiagramListProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <div className="border border-slate-200 rounded-[2.5rem] bg-white shadow-xl shadow-slate-100 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/80 border-b border-slate-200">
          <TableRow>
            <TableHead className="w-[120px] text-center font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">Actions</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">{t('table.subProcess')}</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">{t('table.company')}</TableHead>
            <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">{t('table.location')}</TableHead>
            <TableHead className="w-[100px] text-center font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">{t('table.risks')}</TableHead>
            <TableHead className="w-[100px] text-center font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">{t('table.controls')}</TableHead>
            <TableHead className="w-[80px] text-center font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 py-6">Status</TableHead>
            <TableHead className="w-[80px] py-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bpmLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-48 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('bpm:loading')}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredBpmProcesses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-48 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Info className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium italic">{searchTerm ? t('bpm:noSubProcesses') : t('bpm:noSubProcesses')}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredBpmProcesses.map((bpm, i) => (
            <TableRow 
              key={bpm.id} 
              className={cn(
                "group cursor-pointer transition-colors", 
                i % 2 === 1 && "bg-slate-50/30",
                selectedProcessId === bpm.id ? "bg-indigo-50/50 hover:bg-indigo-50" : "hover:bg-slate-50"
              )}
              onClick={() => onSelectProcess?.(bpm)}
            >
              <TableCell className="py-6 px-4">
                <div className="flex items-center justify-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            const diagram = diagrams?.items.find(d => d.subProcess === bpm.name);
                            if (diagram) onOpenDiagram(diagram.id, bpm.name);
                            else onCreateDiagram(bpm.name);
                          }}
                        >
                          <Map className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 text-white border-none rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">Open Visual Workflow Editor</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon" className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWorksheet(bpm.id, bpm.name);
                          }}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 text-white border-none rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">Open RCM Worksheet</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell className="py-6">
                <div 
                  className="flex flex-col group/name" 
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-slate-900 text-sm group-hover/name:text-indigo-600 transition-colors">
                      {bpm.name}
                    </span>
                    {bpm.bpmCode && <Badge className="h-5 px-2 text-[9px] bg-slate-900 text-white font-bold tracking-widest rounded-lg shrink-0 whitespace-nowrap">{bpm.bpmCode}</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Activity className="h-2.5 w-2.5" /> ID: {bpm.id.substring(0,8)}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-6">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{settings?.companyName || "PT BUMN SEJAHTERA"}</span>
                 </div>
              </TableCell>
              <TableCell className="py-6">
                <Badge variant="outline" className="font-mono text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-500 px-2 h-5 rounded-lg">{selectedGLRow?.entityCode || "ENT-01"}</Badge>
              </TableCell>
              <TableCell className="text-center py-6">
                <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[10px] h-6 px-3 rounded-xl shadow-sm shadow-orange-50">
                   {bpm.riskCount || 0} RISKS
                </Badge>
              </TableCell>
              <TableCell className="text-center py-6">
                <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px] h-6 px-3 rounded-xl shadow-sm shadow-emerald-50">
                  {bpm.controlCount || 0} CONTROLS
                </Badge>
              </TableCell>
              <TableCell className="text-center py-6">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md border-slate-200 text-slate-500">
                  {bpm.workflowStatus || 'Draft'}
                </Badge>
              </TableCell>
              <TableCell className="py-6 px-6 text-right">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-xl" onClick={(e) => { e.stopPropagation(); onDeleteProcess(bpm.id, bpm.name); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
