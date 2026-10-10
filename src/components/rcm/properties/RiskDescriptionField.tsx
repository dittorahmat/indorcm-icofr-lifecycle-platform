import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AiSuggestionPopover, type AiSuggestionContext } from './AiSuggestionPopover';

interface RiskDescriptionFieldProps {
  riskKey: string;
  description: string;
  source?: string;
  suggestContext: AiSuggestionContext | null;
  disabled?: boolean;
  onApply: (riskKey: string, description: string, source: 'ai' | 'manual') => void;
}

export function RiskDescriptionField({ riskKey, description, source, suggestContext, disabled = false, onApply }: RiskDescriptionFieldProps) {
  const { t } = useTranslation(['rcm', 'common']);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Label className="text-xs font-black uppercase text-red-900/50">{t('rcm:matrix.properties.deskripsi_risiko')}</Label>
        <div className="flex items-center gap-1.5 shrink-0">
          {source === 'ai' && (
            <Badge variant="outline" className="h-5 px-1.5 text-xs font-semibold border-amber-300 text-amber-700 bg-amber-50">
              {t('rcm:matrix.aiSuggest.source_ai')}
            </Badge>
          )}
          {suggestContext && (
            <AiSuggestionPopover
              kind="risk"
              context={suggestContext}
              disabled={disabled}
              onApply={(desc) => onApply(riskKey, desc, 'ai')}
            />
          )}
        </div>
      </div>
      <Textarea
        disabled={disabled}
        value={description || ''}
        onChange={(e) => onApply(riskKey, e.target.value, 'manual')}
        className="min-h-[80px] text-sm border-red-200 bg-white focus-visible:ring-red-500"
        placeholder={t('common:placeholders.description')}
      />
    </div>
  );
}
