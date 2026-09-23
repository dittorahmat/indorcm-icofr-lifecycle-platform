import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { ControlLevel } from '@shared/types';
import { TLCForm } from './TLCForm';
import { ELCForm } from './ELCForm';
import { ITGCForm } from './ITGCForm';
import { SignificantApplicationCombobox } from '../SignificantApplicationCombobox';

interface ControlAccordionItemProps {
  ctrl: { data: any; index: number };
  cIdx: number;
  isLocked: boolean;
  duplicateControlIds: Set<string>;
  pairs: any[];
  onUpdateSpecificControl: (index: number, field: string, value: any) => void;
  onDeleteControl: (index: number) => void;
  onUpdateNodeData: (id: string, data: any) => void;
  selectedNodeId: string;
}

const normalizeControlType = (val?: string) => {
  if (!val) return 'Preventif';
  const s = val.toLowerCase();
  if (s.startsWith('prevent')) return 'Preventif';
  if (s.startsWith('detect') || s.startsWith('detekt')) return 'Detektif';
  return val;
};

const normalizeControlNature = (val?: string) => {
  if (!val) return 'Manual';
  const s = val.toLowerCase();
  if (s === 'automated' || s === 'otomatis') return 'Otomatis';
  return val;
};

const normalizeFrequency = (val?: string) => {
  if (!val) return 'Bulanan';
  const s = val.toLowerCase();
  if (s === 'monthly' || s === 'bulanan') return 'Bulanan';
  if (s === 'annual' || s === 'tahunan') return 'Tahunan';
  if (s === 'semi-annual' || s === 'semesteran') return 'Semesteran';
  if (s === 'quarterly' || s === 'kuartalan') return 'Kuartalan';
  if (s === 'weekly' || s === 'mingguan') return 'Mingguan';
  if (s === 'daily' || s === 'harian') return 'Harian';
  return val;
};

export function ControlAccordionItem({
  ctrl,
  cIdx,
  isLocked,
  duplicateControlIds,
  pairs,
  onUpdateSpecificControl,
  onDeleteControl,
  onUpdateNodeData,
  selectedNodeId
}: ControlAccordionItemProps) {
  const { t } = useTranslation(['bpm', 'rcm', 'common']);

  return (
    <AccordionItem value={ctrl.data._tempControlId || `ctrl-${ctrl.index}`} className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/50">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <Select disabled={isLocked} value={ctrl.data.classification || 'TLC'} onValueChange={(v: ControlLevel) => onUpdateSpecificControl(ctrl.index, 'classification', v)}>
              <SelectTrigger className="h-7 w-[80px] text-xs font-bold uppercase shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TLC" className="text-xs">TLC</SelectItem>
                <SelectItem value="ELC" className="text-xs">ELC</SelectItem>
                <SelectItem value="ITGC" className="text-xs">ITGC</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs font-bold text-slate-700">Kontrol #{cIdx + 1}</span>
            <Input 
              disabled={isLocked}
              className={cn(
                "h-7 w-40 text-xs font-mono border-slate-200 bg-slate-50 text-slate-700 uppercase focus-visible:ring-slate-300",
                duplicateControlIds.has(ctrl.data.controlId?.trim()) && "border-rose-500 bg-rose-50 text-rose-900 font-black ring-2 ring-rose-200"
              )}
              value={ctrl.data.controlId || ''} 
              onChange={(e) => onUpdateSpecificControl(ctrl.index, 'controlId', e.target.value)}
              placeholder="PENDING ID"
            />
            {duplicateControlIds.has(ctrl.data.controlId?.trim()) && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs font-semibold uppercase">
                Duplikat!
              </Badge>
            )}
          </div>
        </div>
        <Button 
          disabled={isLocked}
          variant="ghost" size="sm" 
          className="h-7 w-7 text-slate-400 hover:text-rose-600 p-0 mr-2" 
          onClick={(e) => { e.stopPropagation(); onDeleteControl(ctrl.index); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AccordionTrigger>
      <AccordionContent className="p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">{t('rcm:matrix.properties.deskripsi_prosedur')}</Label>
          <Textarea 
            disabled={isLocked}
            value={ctrl.data.controlDescription || ''} 
            onChange={(e) => onUpdateSpecificControl(ctrl.index, 'controlDescription', e.target.value)}
            className="min-h-[80px] text-sm"
            placeholder={t('common:placeholders.description')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">{t('rcm:matrix.properties.key_control_q')}</Label>
            <Select disabled={isLocked} value={ctrl.data.isKeyControl ? 'Yes' : 'No'} onValueChange={(v) => onUpdateSpecificControl(ctrl.index, 'isKeyControl', v === 'Yes')}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">{t('common:yes')}</SelectItem>
                <SelectItem value="No">{t('common:no')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">{t('rcm:matrix.type')}</Label>
            <Select disabled={isLocked} value={normalizeControlType(ctrl.data.controlType)} onValueChange={(v) => onUpdateSpecificControl(ctrl.index, 'controlType', v)}>
              <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Preventif">{t('rcm:matrix.options.type.preventive')}</SelectItem>
                <SelectItem value="Detektif">{t('rcm:matrix.options.type.detective')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">{t('rcm:matrix.nature')}</Label>
            <Select disabled={isLocked} value={normalizeControlNature(ctrl.data.controlNature)} onValueChange={(v) => onUpdateSpecificControl(ctrl.index, 'controlNature', v)}>
              <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">{t('rcm:matrix.options.nature.manual')}</SelectItem>
                <SelectItem value="Otomatis">{t('rcm:matrix.options.nature.automated')}</SelectItem>
                <SelectItem value="ITDM - EUC">{t('rcm:matrix.options.nature.itdm_euc')}</SelectItem>
                <SelectItem value="ITDM - IPE">{t('rcm:matrix.options.nature.itdm_ipe')}</SelectItem>
                <SelectItem value="MRC">{t('rcm:matrix.options.nature.mrc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">{t('rcm:matrix.significant_application', { defaultValue: 'Aplikasi Signifikan' })}</Label>
          <SignificantApplicationCombobox
            disabled={isLocked}
            value={ctrl.data.applicationId}
            appName={ctrl.data.supportingApp}
            onChange={(appId, appName) => {
              const nextPairs = [...pairs];
              const updated = { 
                ...nextPairs[ctrl.index], 
                applicationId: appId,
                supportingApp: appName || ''
              };
              nextPairs[ctrl.index] = updated;
              onUpdateNodeData(selectedNodeId, { regulatoryPairs: nextPairs });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">{t('rcm:matrix.frequency')}</Label>
          <Select disabled={isLocked} value={normalizeFrequency(ctrl.data.frequency)} onValueChange={(v) => onUpdateSpecificControl(ctrl.index, 'frequency', v)}>
            <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Tahunan">{t('rcm:matrix.options.frequency.annual')}</SelectItem>
              <SelectItem value="Semesteran">{t('rcm:matrix.options.frequency.semi_annual')}</SelectItem>
              <SelectItem value="Kuartalan">{t('rcm:matrix.options.frequency.quarterly')}</SelectItem>
              <SelectItem value="Bulanan">{t('rcm:matrix.options.frequency.monthly')}</SelectItem>
              <SelectItem value="Mingguan">{t('rcm:matrix.options.frequency.weekly')}</SelectItem>
              <SelectItem value="Harian">{t('rcm:matrix.options.frequency.daily')}</SelectItem>
              <SelectItem value="Ad-hoc">{t('rcm:matrix.options.frequency.adhoc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          {(!ctrl.data.classification || ctrl.data.classification === 'TLC') && (
            <TLCForm disabled={isLocked} data={ctrl.data} onChange={(f, v) => onUpdateSpecificControl(ctrl.index, f, v)} />
          )}
          {ctrl.data.classification === 'ELC' && (
            <ELCForm disabled={isLocked} data={ctrl.data} onChange={(f, v) => onUpdateSpecificControl(ctrl.index, f, v)} />
          )}
          {ctrl.data.classification === 'ITGC' && (
            <ITGCForm disabled={isLocked} data={ctrl.data} onChange={(f, v) => onUpdateSpecificControl(ctrl.index, f, v)} />
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
