import React, { useState } from 'react';
import { 
  WorkflowAction, WorkflowHistoryEntry, 
  BPMWorkflowStatus, DeficiencyWorkflowStatus, UserRole 
} from '@shared/types';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { 
  CheckCircle2, XCircle, Send, Search, RotateCcw, 
  History, AlertCircle, Lock, Unlock, Loader2, Check, ChevronsUpDown, ChevronDown, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { WorkflowHistoryTimeline } from './WorkflowHistoryTimeline';
import { useWorkflow } from '@/hooks/use-workflow';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Label } from '@/components/ui/label';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';

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
  },
  RCM_CHANGE: {
    steps: {
      'Draft': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'In Review': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:approveAndSave', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Approved': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  },
  CSA: {
    steps: {
      'Draft': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'In Review': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:validateAndSignOff', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Validated': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollbackValidation', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  }
};

interface WorkflowPanelProps {
  entityType: 'BPM' | 'ACTION_PLAN' | 'SCOPING' | 'RCM_CHANGE' | 'CSA';
  entityId: string;
  currentStatus: string;
  history: WorkflowHistoryEntry[];
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

  const quickNotesPresets = [
    t('workflow:quickNotes.approvedAsPerAttachment', { defaultValue: 'Disetujui sesuai lampiran' }),
    t('workflow:quickNotes.verifiedInLineWithSK5', { defaultValue: 'Terverifikasi sesuai standar SK-5' }),
    t('workflow:quickNotes.needMoreSampleEvidence', { defaultValue: 'Mohon lengkapi bukti sampel' }),
    t('workflow:quickNotes.remediationRequired', { defaultValue: 'Rencana remediasi wajib disusun' })
  ];

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
      case 'Resolved':
      case 'Validated': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const isLocked = currentStatus !== 'Draft' && currentStatus !== 'Rejected' && currentStatus !== 'Ineffective';

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
        onSuccess: (data: any) => {
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

    if (beforeAction) {
      const canProceed = await beforeAction(pendingActionId);
      if (!canProceed) return;
    }

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

  const isBypassMode = import.meta.env.VITE_ENABLE_WORKFLOW_APPROVAL === 'false';
  const isAlreadyFinalized = currentStatus === 'Approved' || currentStatus === 'Resolved' || currentStatus === 'Validated';

  const handleBypass = () => {
    if (isDirty) {
      toast.warning(t('common:unsavedChanges.title'), {
        description: t('common:unsavedChanges.description')
      });
      return;
    }

    executeAction({ action: 'Approve', note: 'Bypassed via Demo Mode' }, {
      onSuccess: (data: any) => {
        onStatusChange?.(data.nextStatus);
        toast.success("Demo Mode: Document approved instantly");
      }
    });
  };

  const renderButtons = () => {
    if (isBypassMode && !isAlreadyFinalized) {
      return (
        <div className="w-full space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Demo Mode Active</p>
              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">Standard approval workflow is bypassed. You can instantly finalize this document.</p>
            </div>
          </div>
          <Button 
            className="w-full gap-2 font-black text-[10px] uppercase tracking-widest h-10 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-100"
            onClick={handleBypass}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Bypass & Finalize Approval
          </Button>
        </div>
      );
    }

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

          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="space-y-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-9 px-3 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-100">
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

      {/* Desktop Dialog for Action Confirmation */}
      <Dialog open={!isMobile && isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[425px] max-h-[90dvh] overflow-y-auto shadow-2xl border-slate-200 rounded-lg">
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
                <Popover open={isAssigneePickerOpen} onOpenChange={setIsAssigneePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isAssigneePickerOpen}
                      className="w-full justify-between h-10 bg-slate-50 border-slate-200 font-normal hover:bg-slate-100 transition-colors"
                    >
                      <span className="truncate">
                        {selectedAssigneeId
                          ? uniqueUsers.find((u) => u.id === selectedAssigneeId)?.name
                          : "Select an assignee (optional)"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-2rem)] max-w-[375px] sm:w-[375px] p-0 shadow-2xl border-slate-200" align="start" side="bottom" sideOffset={5}>
                    <Command className="border-none">
                      <CommandInput placeholder="Search by name or role..." className="h-11" />
                      <CommandList className="max-h-[250px] overflow-y-auto">
                        <CommandEmpty className="py-6 text-center text-xs text-slate-400 italic">No users found.</CommandEmpty>
                        <CommandGroup heading="Available Users">
                          {uniqueUsers.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={`${u.name} ${u.role}`}
                              onSelect={() => {
                                setSelectedAssigneeId(u.id);
                                setIsAssigneePickerOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 text-indigo-600 shrink-0",
                                  selectedAssigneeId === u.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-xs text-slate-700 truncate">{u.name}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{u.role}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-slate-500 tracking-widest">Notes {(pendingActionId === 'Reject' || pendingActionId === 'Rollback') && <span className="text-rose-500">*</span>}</Label>
              {/* Quick Note Presets for Mobile and Fast Approval */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  {t('workflow:quickNotes.title', { defaultValue: 'Preset Catatan Cepat' })}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickNotesPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNote(prev => prev ? `${prev} - ${preset}` : preset)}
                      className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-200 active:scale-95 transition-all text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea 
                placeholder={t('workflow:reasonPlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[100px] bg-slate-50 border-slate-200 text-xs sm:text-sm"
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

      {/* Mobile Drawer / Bottom Sheet for Action Confirmation */}
      <Sheet open={isMobile && isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <SheetContent side="bottom" className="p-4 sm:p-6 rounded-t-xl max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]">
          <SheetHeader className="text-left pb-3 border-b">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              {pendingActionId === 'Reject' ? <AlertCircle className="text-rose-500 h-5 w-5" /> : (pendingActionId === 'Rollback' ? <RotateCcw className="text-amber-500 h-5 w-5" /> : <Send className="text-indigo-500 h-5 w-5" />)}
              {t('workflow:confirmAction', { action: pendingActionId })}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {pendingActionId === 'Reject' || pendingActionId === 'Rollback' ? t('workflow:reasonDescription') : "Konfirmasi aksi tata kelola alur kerja ICOFR."}
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-slate-500 tracking-widest">
                Notes {(pendingActionId === 'Reject' || pendingActionId === 'Rollback') && <span className="text-rose-500">*</span>}
              </Label>
              
              {/* Mobile Quick Note Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                  {t('workflow:quickNotes.title', { defaultValue: 'Preset Catatan Cepat' })}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickNotesPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNote(prev => prev ? `${prev} - ${preset}` : preset)}
                      className="text-xs font-medium px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md border border-slate-200 dark:border-slate-700 active:bg-slate-200"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea 
                placeholder={t('workflow:reasonPlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[90px] bg-slate-50 border-slate-200 text-xs"
              />
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 pt-2 border-t">
            <Button variant="outline" className="flex-1 h-10 text-xs font-semibold" onClick={() => setIsNoteDialogOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button 
              variant={pendingActionId === 'Reject' ? 'destructive' : 'default'} 
              className="flex-1 h-10 text-xs font-bold"
              disabled={((pendingActionId === 'Reject' || pendingActionId === 'Rollback') && !note.trim()) || isPending}
              onClick={confirmActionWithNote}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('workflow:confirmAction', { action: pendingActionId })}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
