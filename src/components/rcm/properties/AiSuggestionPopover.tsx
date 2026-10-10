import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Check, Lightbulb, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type AiSuggestKind = 'risk' | 'control';

export interface AiSuggestionContext {
  glCode?: string;
  glDesc?: string;
  bpmName: string;
  nodeLabel: string;
  riskDescription?: string;
}

export interface AiSuggestionItem {
  description: string;
  rationale: string;
}

export interface AiSuggestionResult {
  kind: AiSuggestKind;
  items: AiSuggestionItem[];
  emptyReason: string | null;
}

function contextHash(kind: AiSuggestKind, ctx: AiSuggestionContext): string {
  return JSON.stringify([
    kind,
    ctx.glCode ?? '',
    ctx.glDesc ?? '',
    ctx.bpmName,
    ctx.nodeLabel,
    kind === 'control' ? (ctx.riskDescription ?? '') : '',
  ]);
}

interface AiSuggestionPopoverProps {
  kind: AiSuggestKind;
  context: AiSuggestionContext;
  disabled?: boolean;
  /** When true (control with empty risk), show a hint instead of fetching. */
  blocked?: boolean;
  onApply: (description: string) => void;
}

const EMPTY_REASON_KEYS: Record<string, string> = {
  NODE_LABEL_TOO_GENERIC: 'genericLabel',
  MODEL_EMPTY: 'empty',
  MODEL_INVALID_JSON: 'modelError',
};

export function AiSuggestionPopover({ kind, context, disabled = false, blocked = false, onApply }: AiSuggestionPopoverProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ['ai-suggest-risk-controls', contextHash(kind, context)],
    queryFn: () =>
      api<AiSuggestionResult>('/api/ai/suggest-risk-controls', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          noGL: context.glCode ?? '',
          glDesc: context.glDesc ?? '',
          bpmName: context.bpmName,
          nodeLabel: context.nodeLabel,
          riskDescription: context.riskDescription ?? '',
        }),
      }),
    enabled: false,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
  const { data, isFetching, isError, refetch } = query;

  useEffect(() => {
    if (open && !blocked && !disabled && data === undefined && !isFetching && !isError) {
      void refetch();
    }
  }, [open, blocked, disabled, data, isFetching, isError, refetch]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
  };

  const handleSelect = (description: string) => {
    onApply(description);
    setOpen(false);
  };

  const emptyKey = data?.emptyReason ? (EMPTY_REASON_KEYS[data.emptyReason] ?? 'empty') : 'empty';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={t(`rcm:matrix.aiSuggest.trigger_${kind}`, {
            defaultValue: kind === 'risk' ? 'Sarankan risiko dengan AI' : 'Sarankan kontrol dengan AI',
          })}
          title={t(`rcm:matrix.aiSuggest.trigger_${kind}`, {
            defaultValue: kind === 'risk' ? 'Sarankan risiko dengan AI' : 'Sarankan kontrol dengan AI',
          })}
          className="h-11 w-11 min-h-[44px] min-w-[44px] sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 shrink-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
          <Lightbulb className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-[340px] min-w-0 p-0 shadow-lg rounded-lg" align="start">
        <Command shouldFilter={false}>
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-700">
              {t(`rcm:matrix.aiSuggest.title_${kind}`, {
                defaultValue: kind === 'risk' ? 'Saran Risiko (AI)' : 'Saran Kontrol (AI)',
              })}
            </p>
            <p className="text-xs text-slate-500 truncate" title={`${context.bpmName} • ${context.nodeLabel}`}>
              {context.bpmName} • {context.nodeLabel}
            </p>
          </div>
          <CommandList className="max-h-[280px]">
            {blocked ? (
              <p className="p-3 text-xs text-slate-500">
                {t('rcm:matrix.aiSuggest.risk_required', { defaultValue: 'Isi deskripsi risiko terlebih dahulu untuk mendapatkan saran kontrol.' })}
              </p>
            ) : isFetching ? (
              <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                {t('rcm:matrix.aiSuggest.loading', { defaultValue: 'Meminta saran AI…' })}
              </div>
            ) : isError ? (
              <div className="p-3 space-y-2">
                <p className="text-xs text-rose-700">
                  {t('rcm:matrix.aiSuggest.error', { defaultValue: 'Gagal mendapatkan saran AI. Periksa koneksi atau konfigurasi kunci API, lalu coba lagi.' })}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-11 min-h-[44px] sm:h-8 sm:min-h-0 text-xs gap-1.5"
                  onClick={() => void refetch()}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t('rcm:matrix.aiSuggest.retry', { defaultValue: 'Coba lagi' })}
                </Button>
              </div>
            ) : data && data.items.length > 0 ? (
              <CommandGroup>
                {data.items.map((item) => (
                  <CommandItem
                    key={item.description}
                    value={item.description}
                    onSelect={() => handleSelect(item.description)}
                    className="text-xs flex items-start justify-between gap-2 py-2.5 px-3 cursor-pointer min-h-[44px]"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-800 leading-relaxed">{item.description}</span>
                      {item.rationale && <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">{item.rationale}</span>}
                    </span>
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5 opacity-0 data-[selected=true]:opacity-100" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : data ? (
              <p className="p-3 text-xs text-slate-500">
                {t(`rcm:matrix.aiSuggest.${emptyKey}`, { defaultValue: 'Belum ada saran. Perspesifik nama langkah/node agar AI dapat memberi saran yang relevan.' })}
              </p>
            ) : (
              <p className="p-3 text-xs text-slate-400">
                {t('rcm:matrix.aiSuggest.idle', { defaultValue: 'Membuka saran…' })}
              </p>
            )}
          </CommandList>
          <div className="px-3 py-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400">
              {t('rcm:matrix.aiSuggest.hint_apply', { defaultValue: 'Klik saran untuk mengisi otomatis.' })}
            </span>
            {!isFetching && !blocked && data !== undefined && (
              <button
                type="button"
                onClick={() => void refetch()}
                className={cn('text-xs font-medium text-indigo-600 hover:text-indigo-800 min-h-[44px] sm:min-h-0 px-1')}
              >
                {t('rcm:matrix.aiSuggest.refresh', { defaultValue: 'Muat ulang' })}
              </button>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
