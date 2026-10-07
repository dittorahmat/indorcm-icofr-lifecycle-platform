import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
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
import { 
  AlertCircle, RotateCcw, Send, Check, ChevronsUpDown, Loader2, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { WorkflowAction } from '@shared/types';
import { ActionConfig } from './workflow-blueprints';

interface ActionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  pendingActionId: WorkflowAction | null;
  pendingActionConfig: ActionConfig | null | undefined;
  note: string;
  onNoteChange: (val: string) => void;
  selectedAssigneeId: string;
  onSelectAssignee: (id: string) => void;
  uniqueUsers: { id: string; name: string; role: string }[];
  isAssigneePickerOpen: boolean;
  setIsAssigneePickerOpen: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
}

export function ActionConfirmationDialog({
  open,
  onOpenChange,
  isMobile,
  pendingActionId,
  pendingActionConfig,
  note,
  onNoteChange,
  selectedAssigneeId,
  onSelectAssignee,
  uniqueUsers,
  isAssigneePickerOpen,
  setIsAssigneePickerOpen,
  isPending,
  onConfirm
}: ActionConfirmationDialogProps) {
  const { t } = useTranslation(['common', 'workflow']);

  const quickNotesPresets = [
    t('workflow:quickNotes.approvedAsPerAttachment', { defaultValue: 'Disetujui sesuai lampiran' }),
    t('workflow:quickNotes.verifiedInLineWithSK5', { defaultValue: 'Terverifikasi sesuai standar SK-5' }),
    t('workflow:quickNotes.needMoreSampleEvidence', { defaultValue: 'Mohon lengkapi bukti sampel' }),
    t('workflow:quickNotes.remediationRequired', { defaultValue: 'Rencana remediasi wajib disusun' })
  ];

  const getActionIcon = () => {
    if (pendingActionId === 'Reject') return <AlertCircle className="text-rose-500 h-5 w-5" />;
    if (pendingActionId === 'Rollback') return <RotateCcw className="text-amber-500 h-5 w-5" />;
    return <Send className="text-indigo-500 h-5 w-5" />;
  };

  const isStrictReason = pendingActionId === 'Reject' || pendingActionId === 'Rollback';
  const isSubmitDisabled = (isStrictReason && !note.trim()) || isPending;

  const renderAssigneePicker = () => {
    if (!pendingActionId || !pendingActionConfig?.needsAssignee) return null;
    return (
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
                <CommandEmpty className="py-6 text-center text-xs text-slate-400">No users found.</CommandEmpty>
                <CommandGroup heading="Available Users">
                  {uniqueUsers.map((u) => (
                    <CommandItem
                      key={u.id}
                      value={`${u.name} ${u.role}`}
                      onSelect={() => {
                        onSelectAssignee(u.id);
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
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest truncate">{u.role}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const renderNoteSection = () => (
    <div className="space-y-2">
      <Label className="text-xs uppercase font-bold text-slate-500 tracking-widest">
        Notes {isStrictReason && <span className="text-rose-500">*</span>}
      </Label>
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
              onClick={() => onNoteChange(note ? `${note} - ${preset}` : preset)}
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
        onChange={(e) => onNoteChange(e.target.value)}
        className="min-h-[95px] bg-slate-50 border-slate-200 text-xs sm:text-sm"
      />
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="p-4 sm:p-6 rounded-t-xl max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]">
          <SheetHeader className="text-left pb-3 border-b">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              {getActionIcon()}
              {t('workflow:confirmAction', { action: pendingActionId })}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {isStrictReason ? t('workflow:reasonDescription') : "Konfirmasi aksi tata kelola alur kerja ICOFR."}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            {renderAssigneePicker()}
            {renderNoteSection()}
          </div>
          <SheetFooter className="flex-col-reverse sm:flex-row gap-2 pt-2 border-t">
            <Button variant="outline" className="w-full sm:flex-1 h-11 sm:h-10 min-h-[44px] text-xs font-semibold" onClick={() => onOpenChange(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button 
              variant={pendingActionId === 'Reject' ? 'destructive' : 'default'} 
              className="w-full sm:flex-1 h-11 sm:h-10 min-h-[44px] text-xs font-bold"
              disabled={isSubmitDisabled}
              onClick={onConfirm}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('workflow:confirmAction', { action: pendingActionId })}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[425px] max-h-[90dvh] overflow-y-auto shadow-2xl border-slate-200 rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon()}
            {t('workflow:confirmAction', { action: pendingActionId })}
          </DialogTitle>
          <DialogDescription>
            {isStrictReason ? t('workflow:reasonDescription') : "Please confirm your action and optionally assign it."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {renderAssigneePicker()}
          {renderNoteSection()}
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px]">
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant={pendingActionId === 'Reject' ? 'destructive' : 'default'}
            disabled={isSubmitDisabled}
            onClick={onConfirm}
            className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px]"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('workflow:confirmAction', { action: pendingActionId })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
