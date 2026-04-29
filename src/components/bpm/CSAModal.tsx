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

interface CSAModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noGL: string;
  subProcessName: string;
}

export function CSAModal({ 
  isOpen, 
  onOpenChange, 
  noGL, 
  subProcessName
}: CSAModalProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-slate-50/50 shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  Control Self Assessment: {subProcessName}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm text-muted-foreground flex items-center gap-2">
                <WorkflowIcon className="h-3.5 w-3.5" /> Direct access for GL: {noGL}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <CSATabContent noGL={noGL} standalone={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
