import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { QualitativeLevel } from '@shared/types';
import { ControlAccordionItem } from './ControlAccordionItem';
import { RiskDescriptionField } from './RiskDescriptionField';
import type { AiSuggestionContext } from './useAiSuggestions';

export interface RiskGroupData {
  risk: {
    _tempRiskId?: string;
    riskId?: string;
    riskDescription?: string;
    riskSource?: string;
    isFraudRelated?: boolean;
    riskRating?: string;
  };
  controls: { data: { _tempControlId?: string }; index: number }[];
}

interface RiskGroupCardProps {
  group: RiskGroupData;
  gIdx: number;
  isLocked: boolean;
  isDuplicateRiskId: boolean;
  duplicateControlIds: Set<string>;
  pairs: Record<string, unknown>[];
  riskSuggestBase: AiSuggestionContext | null;
  selectedNodeId: string;
  nodeLabel: string;
  onUpdateRiskField: (riskKey: string, field: string, value: unknown) => void;
  onApplyRiskDescription: (riskKey: string, description: string, source: 'ai' | 'manual') => void;
  onAddControl: (riskKey: string) => void;
  onUpdateSpecificControl: (index: number, field: string, value: unknown) => void;
  onDeleteControl: (index: number) => void;
  onRequestDeleteRisk: (riskKey: string) => void;
  onUpdateNodeData: (id: string, data: Record<string, unknown>) => void;
}

export function RiskGroupCard({
  group,
  gIdx,
  isLocked,
  isDuplicateRiskId,
  duplicateControlIds,
  pairs,
  riskSuggestBase,
  selectedNodeId,
  nodeLabel,
  onUpdateRiskField,
  onApplyRiskDescription,
  onAddControl,
  onUpdateSpecificControl,
  onDeleteControl,
  onRequestDeleteRisk,
  onUpdateNodeData,
}: RiskGroupCardProps) {
  const { t } = useTranslation(['bpm', 'rcm', 'common']);
  const riskKey = group.risk._tempRiskId || group.risk.riskId || `g-${gIdx}`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-red-50/30 border-2 border-red-100 rounded-lg overflow-hidden shadow-sm shadow-red-50">
        <div className="bg-red-600 px-4 py-2 flex justify-between items-center text-white flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="text-xs font-black uppercase tracking-widest">{t('rcm:matrix.properties.id_risiko')} #{gIdx + 1}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isDuplicateRiskId && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs font-semibold uppercase">
                  Duplikat ID!
                </Badge>
              )}
              <Input
                disabled={isLocked}
                className={cn(
                  "h-7 w-40 bg-red-800 border-none text-xs font-mono text-white focus-visible:ring-red-400 placeholder:text-red-400",
                  isDuplicateRiskId && "ring-2 ring-amber-300 bg-red-950 font-black"
                )}
                value={group.risk.riskId || ''}
                onChange={(e) => onUpdateRiskField(riskKey, 'riskId', e.target.value)}
                placeholder="PENDING ID"
              />
            </div>
            <Button disabled={isLocked} variant="ghost" size="icon" className="h-6 w-6 text-red-200 hover:text-white hover:bg-red-700" onClick={() => onRequestDeleteRisk(riskKey)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <RiskDescriptionField
            riskKey={riskKey}
            description={group.risk.riskDescription || ''}
            source={group.risk.riskSource}
            suggestContext={riskSuggestBase}
            disabled={isLocked}
            onApply={onApplyRiskDescription}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.terkait_fraud')}</Label>
              <Select disabled={isLocked} value={group.risk.isFraudRelated ? 'Yes' : 'No'} onValueChange={(v) => onUpdateRiskField(riskKey, 'isFraudRelated', v === 'Yes')}>
                <SelectTrigger className="h-9 text-sm bg-white border-red-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">{t('common:yes')}</SelectItem>
                  <SelectItem value="No">{t('common:no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.risk_rating_label')}</Label>
              <Select disabled={isLocked} value={group.risk.riskRating || 'Low'} onValueChange={(v: QualitativeLevel) => onUpdateRiskField(riskKey, 'riskRating', v)}>
                <SelectTrigger className="h-9 text-sm bg-white border-red-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <Button
              disabled={isLocked}
              variant="outline"
              className="w-full h-10 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs gap-2"
              onClick={() => onAddControl(riskKey)}
            >
              <PlusCircle className="h-4 w-4" /> {t('rcm:matrix.properties.add_control')}
            </Button>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="ml-8 space-y-4">
        {group.controls.map((ctrl, cIdx) => (
          <ControlAccordionItem
            key={ctrl.data._tempControlId || `ctrl-${ctrl.index}`}
            ctrl={ctrl}
            cIdx={cIdx}
            isLocked={isLocked}
            duplicateControlIds={duplicateControlIds}
            pairs={pairs}
            onUpdateSpecificControl={onUpdateSpecificControl}
            onDeleteControl={onDeleteControl}
            onUpdateNodeData={onUpdateNodeData}
            selectedNodeId={selectedNodeId}
            suggestionBase={riskSuggestBase}
            nodeLabel={nodeLabel}
          />
        ))}
      </Accordion>
    </div>
  );
}
