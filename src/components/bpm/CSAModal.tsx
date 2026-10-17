import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShieldCheck, Workflow as WorkflowIcon } from 'lucide-react';
import { CSATabContent } from './CSATabContent';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Control } from '@shared/types';
import { filterWorksheetControls } from '@shared/worksheet-control-scope';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

interface CSAModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noGL: string;
  subProcessName: string;
  bpmProcessId?: string;
}

export function CSAModal({ 
  isOpen, 
  onOpenChange, 
  noGL, 
  subProcessName,
  bpmProcessId
}: CSAModalProps) {
  const workingYear = useFiscalYearStore((state) => state.workingYear);
  // Fetch controls for this process/GL via the shared worksheet scope. The CSA
  // workspace additionally admits orphan controls (no process metadata) that are
  // tagged to this GL — that fallback is the only intended difference from the
  // BPM worksheet/Execution Hub scope.
  const { data: controls } = useQuery({
    queryKey: ['bpm-controls', noGL, bpmProcessId, subProcessName, workingYear],
    queryFn: async () => {
      const all = await api<{ items: Control[] }>(`/api/controls?year=${workingYear}`);
      return filterWorksheetControls(all.items, {
        bpmProcessId,
        subProcessName,
        noGL,
        year: workingYear,
        allowOrphanFallback: true,
      });
    },
    enabled: isOpen
  });
return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[95vw] w-full h-[90dvh] sm:h-[90vh] flex flex-col p-0 overflow-hidden">
      <DialogHeader className="p-4 sm:p-6 border-b bg-slate-50/50 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between flex-wrap gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <span className="text-indigo-600">CSA:</span> {subProcessName}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
              <WorkflowIcon className="h-3.5 w-3.5" /> GL: {noGL}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <CSATabContent 
            noGL={noGL} 
            controls={controls || []}
            bpmProcessId={bpmProcessId}
            standalone={true} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
