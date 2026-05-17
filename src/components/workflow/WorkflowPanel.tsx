import React, { useState } from 'react';
import { 
  WorkflowAction, WorkflowHistoryEntry, 
  BPMWorkflowStatus, DeficiencyWorkflowStatus, UserRole 
} from '@shared/types';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  CheckCircle2, XCircle, Send, Search, RotateCcw, 
  History, AlertCircle, Lock, Unlock, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import { useWorkflow } from '@/hooks/use-workflow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface WorkflowPanelProps {
  entityType: 'BPM' | 'ACTION_PLAN';
  entityId: string;
  currentStatus: string;
  history: WorkflowHistoryEntry[];
  onStatusChange?: (newStatus: string) => void;
  className?: string;
  isDirty?: boolean;
}

export function WorkflowPanel({ 
  entityType, entityId, currentStatus, history, onStatusChange, className, isDirty 
}: WorkflowPanelProps) {
  const { t } = useTranslation(['common', 'bpm', 'deficiency', 'workflow']);
  const { executeAction, isPending } = useWorkflow(entityType, entityId);
  
  const [note, setNote] = useState('');
  const [pendingAction, setPendingAction] = useState<WorkflowAction | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
      case 'Ineffective': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Pending Review':
      case 'In Review': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending Approval':
      case 'In Approval': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Approved':
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const isLocked = currentStatus !== 'Draft' && currentStatus !== 'Rejected' && currentStatus !== 'Ineffective';

  const handleActionClick = (action: WorkflowAction) => {
    if (isDirty) {
      toast.warning(t('common:unsavedChanges.title'), {
        description: t('common:unsavedChanges.description')
      });
      return;
    }

    if (action === 'Reject' || action === 'Rollback') {
      setPendingAction(action);
      setIsNoteDialogOpen(true);
    } else {
      executeAction({ action, note: '' }, {
        onSuccess: (data: any) => {
          onStatusChange?.(data.nextStatus);
        }
      });
    }
  };

  const confirmActionWithNote = () => {
    if (!note.trim()) return;
    if (!pendingAction) return;

    executeAction({ action: pendingAction, note }, {
      onSuccess: (data: any) => {
        onStatusChange?.(data.nextStatus);
        setIsNoteDialogOpen(false);
        setNote('');
        setPendingAction(null);
      }
    });
  };

  const renderButtons = () => {
    if (entityType === 'BPM') {
      switch (currentStatus) {
        case 'Draft':
        case 'Rejected':
          return (
            <Button className="w-full gap-2" onClick={() => handleActionClick('Submit')} disabled={isPending}>
              <Send className="h-4 w-4" /> {t('workflow:submitForReview')}
            </Button>
          );
        case 'Pending Review':
          return (
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-2" onClick={() => handleActionClick('Reject')} disabled={isPending}>
                <XCircle className="h-4 w-4" /> {t('common:status.rejected')}
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => handleActionClick('Review')} disabled={isPending}>
                <Search className="h-4 w-4" /> {t('workflow:passReview')}
              </Button>
            </div>
          );
        case 'Pending Approval':
          return (
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-2" onClick={() => handleActionClick('Reject')} disabled={isPending}>
                <XCircle className="h-4 w-4" /> {t('common:status.rejected')}
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => handleActionClick('Approve')} disabled={isPending}>
                <CheckCircle2 className="h-4 w-4" /> {t('workflow:approveAndSave')}
              </Button>
            </div>
          );
        case 'Approved':
          return (
            <Button variant="outline" className="w-full gap-2 text-amber-600 border-amber-200" onClick={() => handleActionClick('Rollback')} disabled={isPending}>
              <RotateCcw className="h-4 w-4" /> {t('workflow:rollback')}
            </Button>
          );
      }
    } else if (entityType === 'ACTION_PLAN') {
        switch (currentStatus) {
            case 'Ineffective':
              return (
                <Button className="w-full gap-2" onClick={() => handleActionClick('Submit')} disabled={isPending}>
                  <Send className="h-4 w-4" /> {t('workflow:submitPlan')}
                </Button>
              );
            case 'In Review':
              return (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-2" onClick={() => handleActionClick('Reject')} disabled={isPending}>
                    <XCircle className="h-4 w-4" /> {t('workflow:rejectPlan')}
                  </Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => handleActionClick('Review')} disabled={isPending}>
                    <CheckCircle2 className="h-4 w-4" /> {t('workflow:approvePlan')}
                  </Button>
                </div>
              );
            case 'In Approval':
                return (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-2" onClick={() => handleActionClick('Reject')} disabled={isPending}>
                      <XCircle className="h-4 w-4" /> {t('workflow:rejectFinal')}
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => handleActionClick('Approve')} disabled={isPending}>
                      <CheckCircle2 className="h-4 w-4" /> {t('workflow:finalApprove')}
                    </Button>
                  </div>
                );
            case 'Resolved':
                return (
                  <Button variant="outline" className="w-full gap-2 text-amber-600 border-amber-200" onClick={() => handleActionClick('Rollback')} disabled={isPending}>
                    <RotateCcw className="h-4 w-4" /> {t('workflow:rollbackIneffective')}
                  </Button>
                );
          }
    }
    return null;
  };

  return (
    <>
      <Card className={cn("shadow-lg border-slate-200 overflow-hidden", className)}>
        <CardHeader className="bg-slate-50/50 pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> {t('workflow:title')}
            </CardTitle>
            <Badge variant="outline" className={cn("font-bold uppercase tracking-tight text-[10px]", getStatusColor(currentStatus))}>
              {currentStatus}
            </Badge>
          </div>
          <CardDescription className="text-[11px] font-medium">
            {isLocked ? (
                <span className="flex items-center gap-1.5 text-amber-600">
                    <Lock className="h-3 w-3" /> {t('workflow:locked')}
                </span>
            ) : (
                <span className="flex items-center gap-1.5 text-emerald-600">
                    <Unlock className="h-3 w-3" /> {t('workflow:unlocked')}
                </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 space-y-6">
          <div className="flex flex-col gap-3">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('workflow:actions')}</h4>
             <div className="flex flex-wrap gap-2">
                {isPending ? (
                    <Button disabled className="w-full gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t('workflow:processing')}
                    </Button>
                ) : renderButtons()}
             </div>
          </div>

          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('workflow:history')}</h4>
             <ScrollArea className="h-[300px] pr-4">
                <WorkflowHistoryTimeline history={history} />
             </ScrollArea>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50/30 border-t p-3">
            <p className="text-[10px] text-slate-400 font-medium italic">
                {t('workflow:complianceNote')}
            </p>
        </CardFooter>
      </Card>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               {pendingAction === 'Reject' ? <AlertCircle className="text-rose-500 h-5 w-5" /> : <RotateCcw className="text-amber-500 h-5 w-5" />}
               {t('workflow:reasonRequired', { action: pendingAction })}
            </DialogTitle>
            <DialogDescription>
              {t('workflow:reasonDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder={t('workflow:reasonPlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>{t('common:actions.cancel')}</Button>
            <Button 
                variant={pendingAction === 'Reject' ? 'destructive' : 'default'} 
                disabled={!note.trim() || isPending}
                onClick={confirmActionWithNote}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('workflow:confirmAction', { action: pendingAction })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
