import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

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

/**
 * Manual-trigger AI suggestions for BPM node Risk/Control descriptions.
 * The query is disabled by default: callers invoke `refetch()` from the
 * Lightbulb trigger. Results are cached per context hash.
 */
export function useAiSuggestions(kind: AiSuggestKind, context: AiSuggestionContext) {
  return useQuery({
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
}
