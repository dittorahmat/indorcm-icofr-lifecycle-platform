import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSpreadsheet, Network, History, Printer, Send, 
  CheckCircle2, XCircle, Loader2, Save, PlusCircle, Building2, UserCircle, ShieldCheck
} from 'lucide-react';
import { BPMWorksheet } from './BPMWorksheet';
import { Lampiran6LogView } from './Lampiran6LogView';
import { CSATabContent } from './CSATabContent';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Control, User, BPMWorkflowStatus } from '@shared/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BPMModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noGL: string;
  glDesc: string;
  fsliName: string;
  bpmProcessId?: string;
}

export function BPMModal({ 
  isOpen, 
  onOpenChange, 
  noGL, 
  glDesc, 
  fsliName,
  bpmProcessId 
}: BPMModalProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("worksheet");

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const { data: controls, isLoading } = useQuery({
    queryKey: ['bpm-controls', noGL, bpmProcessId],
    queryFn: async () => {
      console.log('[BPMModal] Fetching controls for GL:', noGL, 'BPM Process:', bpmProcessId);
      const all = await api<{ items: Control[] }>('/api/controls');
      
      // Filter logic: match by bpmProcessId OR fsliCodes
      const filtered = all.items.filter(c => {
        const matchesBpm = bpmProcessId && c.bpmProcessId === bpmProcessId;
        const matchesFsli = c.fsliCodes?.includes(noGL);
        return matchesBpm || matchesFsli;
      });
      
      console.log('[BPMModal] Filtered controls count:', filtered.length);
      return filtered;
    },
    enabled: isOpen
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => api(`/api/controls/${id}/submit-for-approval`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
      toast.success("Submitted for approval");
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api(`/api/controls/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
      toast.success("Approved and logged to Lampiran 6");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api(`/api/controls/${id}/reject`, { method: 'POST', body: JSON.stringify({ note: "Rejected by Manager" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bpm-controls'] });
      toast.error("Control changes rejected");
    }
  });

  const isLini1Manager = currentUser?.role === 'Line 1' && currentUser?.level === 'Manager';
  const isLini1Staff = currentUser?.role === 'Line 1' && currentUser?.level === 'Staff';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-slate-50/50 shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {t('modal.title')}: {glDesc}
                </DialogTitle>
                <Badge variant="outline" className="bg-white font-mono text-indigo-600 border-indigo-100">
                  {noGL}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" /> {fsliName} | 
                <UserCircle className="h-3.5 w-3.5" /> {t('modal.owner')}: Finance & Accounting
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 text-indigo-600 border-indigo-200">
                <Printer className="h-4 w-4" /> Print Lampiran 4
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>{t('common:actions.cancel')}</Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b bg-white shrink-0">
              <TabsList className="h-12 bg-transparent gap-6 p-0">
                <TabsTrigger value="worksheet" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-bold text-slate-500">
                  <FileSpreadsheet className="h-4 w-4" /> {t('modal.tabs.worksheet')}
                </TabsTrigger>
                <TabsTrigger value="csa" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-bold text-slate-500">
                  <ShieldCheck className="h-4 w-4" /> {t('modal.tabs.csa')}
                </TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 gap-2 font-bold text-slate-500">
                  <History className="h-4 w-4" /> {t('modal.tabs.logs')}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 bg-slate-50/30 overflow-hidden">
              <TabsContent value="worksheet" className="m-0 focus-visible:ring-0 h-full overflow-hidden">
                <BPMWorksheet 
                  noGL={noGL} 
                  fsliName={fsliName} 
                  bpmProcessId={bpmProcessId || ""} 
                />
              </TabsContent>

              <TabsContent value="csa" className="m-0 h-full overflow-auto p-6">
                <CSATabContent noGL={noGL} controls={controls || []} />
              </TabsContent>

              <TabsContent value="logs" className="m-0 h-full overflow-auto p-6">
                <Lampiran6LogView entityId={noGL} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: BPMWorkflowStatus }) {
  switch (status) {
    case 'Approved': return <Badge className="bg-green-600 h-5 text-[9px]">Approved</Badge>;
    case 'Pending Approval': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 h-5 text-[9px]">Pending</Badge>;
    case 'Rejected': return <Badge variant="destructive" className="h-5 text-[9px]">Rejected</Badge>;
    default: return <Badge variant="outline" className="h-5 text-[9px]">{status}</Badge>;
  }
}
