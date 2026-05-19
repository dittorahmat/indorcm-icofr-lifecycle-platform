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
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// --- Workflow Blueprints Definition ---

interface ActionConfig {
  id: WorkflowAction;
  labelKey: string;
  variant?: 'default' | 'outline' | 'destructive' | 'indigo' | 'emerald' | 'amber';
  icon: any;
  needsAssignee?: boolean;
  needsNote?: boolean;
}

interface WorkflowBlueprint {
  steps: Record<string, {
    actions: ActionConfig[];
  }>;
}

const WORKFLOW_BLUEPRINTS: Record<string, WorkflowBlueprint> = {
  BPM: {
    steps: {
      'Draft': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'Rejected': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'In Review': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Review', labelKey: 'workflow:passReview', icon: Search, variant: 'indigo', needsAssignee: true }
        ] 
      },
      'In Approval': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:approveAndSave', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Resolved': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  },
  ACTION_PLAN: {
    steps: {
      'Ineffective': { actions: [{ id: 'Submit', labelKey: 'workflow:submitPlan', icon: Send, needsAssignee: true }] },
      'In Review': { 
        actions: [
          { id: 'Reject', labelKey: 'workflow:rejectPlan', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Review', labelKey: 'workflow:approvePlan', icon: CheckCircle2, variant: 'indigo', needsAssignee: true }
        ] 
      },
      'In Approval': { 
        actions: [
          { id: 'Reject', labelKey: 'workflow:rejectFinal', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:finalApprove', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Resolved': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollbackIneffective', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  },
  // Ready for Scoping extension
  SCOPING: {
    steps: {
      'Draft': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'Pending CFO': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Review', labelKey: 'workflow:passReview', icon: Search, variant: 'indigo', needsAssignee: true }
        ] 
      },
      'Pending Komut': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:finalApprove', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Approved': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  }
};

interface WorkflowPanelProps {
  entityType: 'BPM' | 'ACTION_PLAN' | 'SCOPING';
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
  const [pendingActionId, setPendingActionId] = useState<WorkflowAction | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');

  const blueprint = WORKFLOW_BLUEPRINTS[entityType];
  const currentStep = blueprint?.steps[currentStatus] || { actions: [] };

  const findActionConfig = (actionId: WorkflowAction) => {
    return currentStep.actions.find(a => a.id === actionId);
  };

  const pendingActionConfig = pendingActionId ? findActionConfig(pendingActionId) : null;

  const { data: users } = useQuery({
    queryKey: ['users-for-workflow'],
    queryFn: () => api<{ items: { id: string, name: string, role: string }[] }>('/api/users'),
  });

  const uniqueUsers = React.useMemo(() => {
    if (!users?.items) return [];
    return Array.from(new Map(users.items.map(item => [item.id, item])).values());
  }, [users?.items]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
      case 'Ineffective': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Pending Review':
      case 'In Review':
      case 'Pending CFO': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending Approval':
      case 'In Approval':
      case 'Pending Komut': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Approved':
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const isLocked = currentStatus !== 'Draft' && currentStatus !== 'Rejected' && currentStatus !== 'Ineffective';

  const handleActionClick = (actionId: WorkflowAction) => {
    if (isDirty) {
      toast.warning(t('common:unsavedChanges.title'), {
        description: t('common:unsavedChanges.description')
      });
      return;
    }

    const config = findActionConfig(actionId);
    if (!config) return;

    if (config.needsNote || config.needsAssignee) {
      setPendingActionId(actionId);
      setIsNoteDialogOpen(true);
    } else {
      executeAction({ action: actionId, note: '' }, {
        onSuccess: (data: any) => {
          onStatusChange?.(data.nextStatus);
        }
      });
    }
  };

  const confirmActionWithNote = () => {
    if (!pendingActionId) return;
    const config = findActionConfig(pendingActionId);
    if (!config) return;

    if (config.needsNote && !note.trim()) return;

    executeAction({ action: pendingActionId, note, assigneeId: selectedAssigneeId || undefined }, {
      onSuccess: (data: any) => {
        onStatusChange?.(data.nextStatus);
        setIsNoteDialogOpen(false);
        setNote('');
        setSelectedAssigneeId('');
        setPendingActionId(null);
      }
    });
  };

  const renderButtons = () => {
    return currentStep.actions.map((action) => {
      const Icon = action.icon;
      
      // Map custom variants to Shadcn Button variants
      const shadcnVariant = (action.variant === 'outline' || action.variant === 'destructive') ? action.variant : 'default';
      
      // Custom classes for special colors
      const customClass = cn(
        "w-full gap-2 font-bold text-[10px] uppercase tracking-widest h-9",
        action.variant === 'indigo' && "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100",
        action.variant === 'emerald' && "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100",
        action.variant === 'amber' && "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-100",
        action.variant === 'outline' && "border-slate-200 text-slate-600 hover:bg-slate-50"
      );

      return (
        <Button 
          key={action.id}
          variant={shadcnVariant} 
          className={customClass}
          onClick={() => handleActionClick(action.id)}
          disabled={isPending}
        >
          <Icon className="h-3.5 w-3.5" />
          {t(action.labelKey)}
        </Button>
      );
    });
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
        <DialogContent className="sm:max-w-[425px] shadow-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               {pendingActionId === 'Reject' ? <AlertCircle className="text-rose-500 h-5 w-5" /> : (pendingActionId === 'Rollback' ? <RotateCcw className="text-amber-500 h-5 w-5" /> : <Send className="text-indigo-500 h-5 w-5" />)}
               {t('workflow:confirmAction', { action: pendingActionId })}
            </DialogTitle>
            <DialogDescription>
              {pendingActionId === 'Reject' || pendingActionId === 'Rollback' ? t('workflow:reasonDescription') : "Please confirm your action and optionally assign it."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {pendingActionId && pendingActionConfig?.needsAssignee && (
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Assignee</Label>
                <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select an assignee (optional)" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="max-h-[200px]">
                    {uniqueUsers.length > 0 ? (
                      uniqueUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-slate-400 italic text-center">No users available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Notes {(pendingActionId === 'Reject' || pendingActionId === 'Rollback') && <span className="text-rose-500">*</span>}</Label>
              <Textarea 
                placeholder={t('workflow:reasonPlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[100px] bg-slate-50 border-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>{t('common:actions.cancel')}</Button>
            <Button 
                variant={pendingActionId === 'Reject' ? 'destructive' : 'default'} 
                disabled={((pendingActionId === 'Reject' || pendingActionId === 'Rollback') && !note.trim()) || isPending}
                onClick={confirmActionWithNote}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('workflow:confirmAction', { action: pendingActionId })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
