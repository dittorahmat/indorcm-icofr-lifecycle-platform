import React, { useState } from 'react';
import { WorkflowAction, WorkflowHistoryEntry, ApprovalHistoryEntry } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Lock, Unlock, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import { useWorkflow } from '@/hooks/use-workflow';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { 
  WorkflowEntityType, 
  getWorkflowStep, 
  getStatusBadgeClass, 
  isWorkflowLocked 
} from './workflow-blueprints';
import { ActionConfirmationDialog } from './ActionConfirmationDialog';

interface WorkflowPanelProps {
  entityType: WorkflowEntityType;
  entityId: string;
  currentStatus: string;
  /** Scoping keeps its lifecycle in `ApprovalHistoryEntry`; every other entity
   *  writes `WorkflowHistoryEntry`. The timeline renders both. */
  history: (WorkflowHistoryEntry | ApprovalHistoryEntry)[];
  onStatusChange?: (newStatus: string) => void;
  className?: string;
  isDirty?: boolean;
  beforeAction?: (actionId: WorkflowAction) => boolean | Promise<boolean>;
}

export function WorkflowPanel({ 
  entityType, entityId, currentStatus, history, onStatusChange, className, isDirty, beforeAction 
}: WorkflowPanelProps) {
  const { t } = useTranslation(['common', 'bpm', 'deficiency', 'workflow']);
  const { executeAction, isPending } = useWorkflow(entityType, entityId);
  
  const [note, setNote] = useState('');
  const [pendingActionId, setPendingActionId] = useState<WorkflowAction | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [isAssigneePickerOpen, setIsAssigneePickerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const isMobile = useIsMobile();

  const currentStep = getWorkflowStep(entityType, currentStatus);
  const findActionConfig = (actionId: WorkflowAction) => currentStep.actions.find(a => a.id === actionId);
  const pendingActionConfig = pendingActionId ? findActionConfig(pendingActionId) : null;

  const { data: users } = useQuery({
    queryKey: ['users-for-workflow'],
    queryFn: () => api<{ items: { id: string, name: string, role: string }[] }>('/api/users'),
  });

  const uniqueUsers = React.useMemo(() => {
    if (!users?.items) return [];
    return Array.from(new Map(users.items.map(item => [item.id, item])).values());
  }, [users?.items]);

  const isLocked = isWorkflowLocked(entityType, currentStatus);

  const handleActionClick = async (actionId: WorkflowAction) => {
    if (isDirty) {
      toast.warning(t('common:unsavedChanges.title'), {
        description: t('common:unsavedChanges.description')
      });
      return;
    }

    if (beforeAction) {
      const canProceed = await beforeAction(actionId);
      if (!canProceed) return;
    }

    const config = findActionConfig(actionId);
    if (!config) return;

    if (config.needsNote || config.needsAssignee) {
      setPendingActionId(actionId);
      setIsNoteDialogOpen(true);
    } else {
      executeAction({ action: actionId, note: '' }, {
        onSuccess: (data: { nextStatus: string }) => {
          onStatusChange?.(data.nextStatus);
        }
      });
    }
  };

  const confirmActionWithNote = async () => {
    if (!pendingActionId) return;
    const config = findActionConfig(pendingActionId);
    if (!config) return;
    if (config.needsNote && !note.trim()) return;

    // beforeAction already gated handleActionClick before the dialog opened —
    // invoking it again here would double-fire caller side-effects.
    executeAction({ action: pendingActionId, note, assigneeId: selectedAssigneeId || undefined }, {
      onSuccess: (data: { nextStatus: string }) => {
        onStatusChange?.(data.nextStatus);
        setIsNoteDialogOpen(false);
        setNote('');
        setSelectedAssigneeId('');
        setPendingActionId(null);
      }
    });
  };

  const renderButtons = () => {
    // Every action routes through the transactional engine via useWorkflow —
    // no demo bypass may skip validation.
    return currentStep.actions.map((action) => {
      const Icon = action.icon;
      const shadcnVariant = (action.variant === 'outline' || action.variant === 'destructive') ? action.variant : 'default';
      const customClass = cn(
        "w-full gap-2 font-bold text-xs uppercase tracking-widest h-9",
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> {t('workflow:title')}
            </CardTitle>
            <Badge variant="outline" className={cn("font-bold uppercase tracking-tight text-xs", getStatusBadgeClass(currentStatus))}>
              {currentStatus}
            </Badge>
          </div>
          <CardDescription className="text-xs font-medium">
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
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('workflow:actions')}</h4>
            <div className="flex flex-wrap gap-2">
              {isPending ? (
                <Button disabled className="w-full gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('workflow:processing')}
                </Button>
              ) : renderButtons()}
            </div>
          </div>

          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="space-y-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-11 sm:h-9 min-h-[44px] px-3 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                <span className="flex items-center gap-2">
                  {t('workflow:history')} ({history?.length ?? 0})
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isHistoryOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              <ScrollArea className="h-[300px] pr-4">
                <WorkflowHistoryTimeline history={history} />
              </ScrollArea>
              <p className="text-xs text-slate-500 font-normal border-t border-slate-100 pt-3">
                {t('workflow:complianceNote')}
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <ActionConfirmationDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        isMobile={isMobile}
        pendingActionId={pendingActionId}
        pendingActionConfig={pendingActionConfig}
        note={note}
        onNoteChange={setNote}
        selectedAssigneeId={selectedAssigneeId}
        onSelectAssignee={setSelectedAssigneeId}
        uniqueUsers={uniqueUsers}
        isAssigneePickerOpen={isAssigneePickerOpen}
        setIsAssigneePickerOpen={setIsAssigneePickerOpen}
        isPending={isPending}
        onConfirm={confirmActionWithNote}
      />
    </>
  );
}
