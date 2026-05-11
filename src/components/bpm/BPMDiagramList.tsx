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
  Edit2, FileSpreadsheet, Trash2, ShieldCheck, Loader2, Info
} from 'lucide-react';
import { BPMProcess, BPMDiagram, Settings, GLRow } from '@shared/types';
import { useTranslation } from 'react-i18next';

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
  searchTerm
}: BPMDiagramListProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[80px] text-center">{t('table.action')}</TableHead>
            <TableHead className="font-bold">{t('table.subProcess')}</TableHead>
            <TableHead className="font-bold">{t('table.company')}</TableHead>
            <TableHead className="font-bold">{t('table.location')}</TableHead>
            <TableHead className="text-center font-bold">{t('table.risks')}</TableHead>
            <TableHead className="text-center font-bold">{t('table.controls')}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bpmLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
                <p className="text-xs text-slate-400 mt-2">{t('bpm:loading')}</p>
              </TableCell>
            </TableRow>
          ) : filteredBpmProcesses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
                <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 italic">{searchTerm ? t('bpm:noSubProcesses') : t('bpm:noSubProcesses')}</p>
              </TableCell>
            </TableRow>
          ) : filteredBpmProcesses.map((bpm) => (
            <TableRow key={bpm.id} className="group hover:bg-indigo-50/30 transition-colors">
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-100"
                          onClick={() => {
                            const diagram = diagrams?.items.find(d => d.subProcess === bpm.name);
                            if (diagram) onOpenDiagram(diagram.id, bpm.name);
                            else onCreateDiagram(bpm.name);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open Visual Workflow Editor</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-100"
                          onClick={() => onOpenWorksheet(bpm.id, bpm.name)}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open RCM Worksheet (Spreadsheet)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="flex flex-col cursor-pointer p-1 rounded group/name" 
                        onClick={() => onOpenWorksheet(bpm.id, bpm.name)}
                      >
                        <span className="font-bold text-indigo-600 hover:underline flex items-center gap-1.5">
                          {bpm.name}
                          {bpm.bpmCode && <Badge className="h-4 px-1 text-[8px] bg-slate-900 text-white font-mono">{bpm.bpmCode}</Badge>}
                          <ShieldCheck className="h-3 w-3 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                           ID: {bpm.id.substring(0,8)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Open Execution Hub (CSA, Sampling, RCM)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-slate-600 font-medium text-xs">{settings?.companyName || "PT BUMN SEjahtera"}</TableCell>
              <TableCell><Badge variant="outline" className="font-mono text-[10px] bg-slate-50">{selectedGLRow?.entityCode || "ENT-01"}</Badge></TableCell>
              <TableCell className="text-center"><Badge className="bg-orange-100 text-orange-700 font-bold">{bpm.riskCount || 0}</Badge></TableCell>
              <TableCell className="text-center"><Badge className="bg-green-100 text-green-700 font-bold">{bpm.controlCount || 0}</Badge></TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); onDeleteProcess(bpm.id, bpm.name); }}>
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
