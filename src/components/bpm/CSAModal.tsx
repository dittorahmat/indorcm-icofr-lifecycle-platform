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
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Control } from '@shared/types';

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
  const { t } = useTranslation(['bpm', 'common']);
  // Fetch controls for this process/GL
  const { data: controls } = useQuery({
    queryKey: ['bpm-controls', noGL, bpmProcessId, subProcessName],
    queryFn: async () => {
      const all = await api<{ items: Control[] }>('/api/controls');
      return all.items.filter(c => {
        const cSub = (c.subProcess || "").toLowerCase().trim();
        const targetSub = (subProcessName || "").toLowerCase().trim();

        // Match 1: Hard ID link (Primary)
        if (bpmProcessId && c.bpmProcessId === bpmProcessId) return true;
        
        // Match 2: Name link (Reliable Fallback)
        if (targetSub && cSub === targetSub) return true;
        
        // Match 3: Orphan link (Fallback for data missing process metadata but linked to GL)
        if (!c.bpmProcessId && !cSub && c.fsliCodes?.includes(noGL)) return true;
        
        return false;
      });
    },
    enabled: isOpen
  });
return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 overflow-hidden">
      <DialogHeader className="p-6 border-b bg-slate-50/50 shrink-0">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div className="space-y-1">
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
