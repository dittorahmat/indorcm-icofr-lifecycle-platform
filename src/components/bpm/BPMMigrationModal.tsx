import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight, ArrowUpRight, FolderTree, GitMerge, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BPMProcess } from '@shared/types';
import { cn } from '@/lib/utils';

interface BPMMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProcessIds: string[];
  allProcesses: BPMProcess[];
  candidateParents: BPMProcess[];
  onConfirm: (payload: { action: 'demote' | 'promote'; targetParentId?: string; processIds: string[] }) => void;
  isPending: boolean;
}

export function BPMMigrationModal({
  isOpen,
  onClose,
  selectedProcessIds,
  allProcesses,
  candidateParents,
  onConfirm,
  isPending,
}: BPMMigrationModalProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const [action, setAction] = useState<'demote' | 'promote'>('demote');
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  // Selected process items details
  const selectedItems = React.useMemo(() => {
    return allProcesses.filter((p) => selectedProcessIds.includes(p.id));
  }, [allProcesses, selectedProcessIds]);

  const targetParent = React.useMemo(() => {
    return candidateParents.find((p) => p.id === selectedParentId);
  }, [candidateParents, selectedParentId]);

  React.useEffect(() => {
    if (isOpen) {
      // If current selectedParentId is not valid in candidateParents, pick the first candidate
      const isValidParent = candidateParents.some((p) => p.id === selectedParentId);
      if (!isValidParent) {
        setSelectedParentId(candidateParents.length > 0 ? candidateParents[0].id : '');
      }
    }
  }, [isOpen, candidateParents, selectedParentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (action === 'demote' && !selectedParentId) {
      return;
    }
    onConfirm({
      action,
      targetParentId: action === 'demote' ? selectedParentId : undefined,
      processIds: selectedProcessIds,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-lg p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-display font-extrabold text-slate-900 tracking-tight">
                {t('bpm:migration.modalTitle', 'Reorganisasi & Migrasi Hierarki Proses')}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                {t('bpm:migration.modalDesc', {
                  count: selectedProcessIds.length,
                  defaultValue: `Ubah struktur kedudukan ${selectedProcessIds.length} entitas yang dipilih secara dua arah.`,
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Action Choice: Demote vs Promote */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t('bpm:migration.chooseAction', 'Pilih Arah Migrasi')}
            </Label>
            <RadioGroup
              value={action}
              onValueChange={(val) => setAction(val as 'demote' | 'promote')}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <label
                htmlFor="mode-demote"
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none',
                  action === 'demote'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                )}
              >
                <RadioGroupItem value="demote" id="mode-demote" className="mt-0.5 pointer-events-none" />
                <div className="space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                    <ArrowDownRight className="h-3.5 w-3.5 text-indigo-600" />
                    {t('bpm:migration.demoteTitle', 'Jadikan Sub-Proses (Child)')}
                  </span>
                  <p className="text-xs text-slate-500 leading-snug">
                    {t('bpm:migration.demoteDesc', 'Kelompokkan entitas terpilih di bawah satu Proses Induk.')}
                  </p>
                </div>
              </label>

              <label
                htmlFor="mode-promote"
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none',
                  action === 'promote'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                )}
              >
                <RadioGroupItem value="promote" id="mode-promote" className="mt-0.5 pointer-events-none" />
                <div className="space-y-1">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                    <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" />
                    {t('bpm:migration.promoteTitle', 'Jadikan Proses Mandiri (Parent)')}
                  </span>
                  <p className="text-xs text-slate-500 leading-snug">
                    {t('bpm:migration.promoteDesc', 'Lepaskan dari induk dan angkat menjadi Proses Utama (Root).')}
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Demote: Select Target Parent */}
          {action === 'demote' && (
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Label htmlFor="target-parent" className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <FolderTree className="h-3.5 w-3.5 text-indigo-600" />
                {t('bpm:migration.targetParentLabel', 'Pilih Proses Induk Tujuan')}
              </Label>
              {candidateParents.length === 0 ? (
                <p className="text-xs text-amber-600 font-medium">
                  {t('bpm:migration.noCandidateParents', 'Tidak ada proses induk mandiri yang tersedia sebagai tujuan.')}
                </p>
              ) : (
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger id="target-parent" className="bg-white border-slate-200 text-xs font-semibold h-10 rounded-lg">
                    <SelectValue placeholder={t('bpm:migration.selectParentPlaceholder', 'Pilih Proses Induk...')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {candidateParents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id} className="text-xs font-medium py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{parent.name}</span>
                          {parent.bpmCode && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 bg-slate-100">
                              {parent.bpmCode}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Live Preview Card */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {t('bpm:migration.previewLabel', 'Pratinjau Hasil Struktur')}
            </Label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
              {action === 'demote' ? (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>📁</span>
                    <span>{targetParent?.name || t('bpm:migration.unselectedParent', '(Pilih proses induk)')}</span>
                    <Badge variant="secondary" className="text-xs py-0 px-1.5 uppercase font-bold">
                      {t('bpm:hierarchy.parentBadge', 'Proses Induk')}
                    </Badge>
                  </div>
                  <div className="pl-6 space-y-1 border-l-2 border-slate-200 ml-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="text-slate-600 flex items-center gap-2 py-0.5">
                        <span>📄</span>
                        <span className="font-medium truncate">{item.name}</span>
                        {item.bpmCode && (
                          <span className="text-xs text-slate-400 font-mono">({item.bpmCode})</span>
                        )}
                        <span className="text-xs text-indigo-600 font-semibold ml-auto shrink-0">
                          {t('bpm:hierarchy.childBadge', '➔ Sub-Proses')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="text-slate-800 flex items-center gap-2 py-1 border-b border-slate-100 last:border-0">
                      <span>📁</span>
                      <span className="font-bold truncate">{item.name}</span>
                      <Badge variant="outline" className="text-xs py-0 px-1.5 text-emerald-700 bg-emerald-50 border-emerald-200 uppercase font-bold ml-auto shrink-0">
                        {t('bpm:hierarchy.standaloneBadge', 'Mandiri (Root)')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-slate-100 flex-col-reverse sm:flex-row pb-[env(safe-area-inset-bottom,0px)] sm:pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="rounded-md h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-wider w-full sm:w-auto"
            >
              {t('common:actions.cancel', 'Batal')}
            </Button>
            <Button
              type="submit"
              disabled={isPending || (action === 'demote' && !selectedParentId)}
              className="bg-mancity-pattern text-primary-foreground hover:opacity-90 rounded-md h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold uppercase tracking-wider px-5 shadow-sm w-full sm:w-auto"
            >
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {t('bpm:migration.applyButton', 'Terapkan Struktur')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
