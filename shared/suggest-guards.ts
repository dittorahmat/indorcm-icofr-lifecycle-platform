/**
 * suggest-guards — single fetch-gating seam for AI Risk/Control suggestions
 * (SK-5/DKU.MBU/11/2024 Lampiran 2 & 3).
 *
 * One predicate decides whether a suggestion round is worth running.
 * The worker seam (`suggestRiskControls`) and the client adapter
 * (`AiSuggestionPopover`) both derive their blocked state from it, so the
 * "when do we not call the LLM" policy is reviewed in one place. Kind
 * rejection stays with input validation; this module only gates.
 */

import { trimText } from './ai-cache';

export type SuggestGateReason = 'MISSING_CONTEXT' | 'GENERIC_LABEL' | 'RISK_REQUIRED' | null;

export interface SuggestGateInput {
  kind: string;
  bpmName?: unknown;
  nodeLabel?: unknown;
  riskDescription?: unknown;
}

export interface SuggestGate {
  blocked: boolean;
  reason: SuggestGateReason;
}

const GENERIC_NODE_LABEL_PATTERN = /^(proses|langkah|langkah_kerja|step|process|node|activity|aktivitas|task|tahap)[\s._-]*\d*$/i;

export function isGenericNodeLabel(label: string): boolean {
  const trimmed = label.trim();
  if (trimmed.length < 4) return true;
  return GENERIC_NODE_LABEL_PATTERN.test(trimmed);
}

/** Fetch gate: missing context, generic label, then control-without-risk. */
export function suggestGate(input: SuggestGateInput): SuggestGate {
  const bpmName = trimText(input.bpmName);
  const nodeLabel = trimText(input.nodeLabel);
  if (!bpmName || !nodeLabel) return { blocked: true, reason: 'MISSING_CONTEXT' };
  if (isGenericNodeLabel(nodeLabel)) return { blocked: true, reason: 'GENERIC_LABEL' };
  if (input.kind === 'control' && !trimText(input.riskDescription)) {
    return { blocked: true, reason: 'RISK_REQUIRED' };
  }
  return { blocked: false, reason: null };
}
