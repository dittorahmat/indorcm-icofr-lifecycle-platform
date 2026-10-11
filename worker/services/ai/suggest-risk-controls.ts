import { jsonrepair } from 'jsonrepair';
import { AppError } from '../../lib/utils';
import { suggestGate } from '@shared/suggest-guards';

export type SuggestKind = 'risk' | 'control';
export type SuggestionSource = 'ai' | 'library' | 'manual';

export interface SuggestionContextInput {
  noGL?: unknown;
  glDesc?: unknown;
  bpmName?: unknown;
  nodeLabel?: unknown;
  riskDescription?: unknown;
}

export interface SuggestionContext {
  noGL: string;
  glDesc: string;
  bpmName: string;
  nodeLabel: string;
  riskDescription: string;
}

export interface SuggestionItem {
  description: string;
  rationale: string;
}

export interface SuggestResult {
  kind: SuggestKind;
  items: SuggestionItem[];
  emptyReason: string | null;
}

export const MAX_SUGGESTIONS = 3;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_RATIONALE_LENGTH = 300;

/** Plain-JSON Gemini response schema (string literals match SchemaType values). */
export const SUGGEST_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          description: { type: 'STRING' },
          rationale: { type: 'STRING' },
        },
        required: ['description'],
      },
    },
  },
  required: ['items'],
};

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Parses the raw kind field. Rejects anything but risk/control with AppError(400). */
export function parseSuggestKind(value: unknown): SuggestKind {
  if (value === 'risk' || value === 'control') return value;
  throw new AppError('INVALID_SUGGEST_REQUEST', 'kind harus "risk" atau "control".', 400);
}

/** Validates the raw request body. Throws AppError(400) on invalid input. */
export function validateSuggestInput(body: unknown, kind: SuggestKind): SuggestionContext {
  if (!body || typeof body !== 'object') {
    throw new AppError('INVALID_SUGGEST_REQUEST', 'Request body harus berupa objek JSON.', 400);
  }
  const input = body as SuggestionContextInput;
  const ctx: SuggestionContext = {
    noGL: asTrimmedString(input.noGL),
    glDesc: asTrimmedString(input.glDesc),
    bpmName: asTrimmedString(input.bpmName),
    nodeLabel: asTrimmedString(input.nodeLabel),
    riskDescription: asTrimmedString(input.riskDescription),
  };
  if (!ctx.bpmName) throw new AppError('INVALID_SUGGEST_REQUEST', 'bpmName wajib diisi.', 400);
  if (!ctx.nodeLabel) throw new AppError('INVALID_SUGGEST_REQUEST', 'nodeLabel wajib diisi.', 400);
  if (kind === 'control' && !ctx.riskDescription) {
    throw new AppError('RISK_REQUIRED', 'Deskripsi risiko wajib diisi sebelum meminta saran kontrol.', 400);
  }
  return ctx;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Builds the SK-5-locked prompt sent to the LLM. Pure: no network. */
export function buildSuggestPrompt(ctx: SuggestionContext, kind: SuggestKind): string {
  const glLine = ctx.noGL ? `GL/No. Akun: ${ctx.noGL}${ctx.glDesc ? ` (${ctx.glDesc})` : ''}` : 'GL/No. Akun: -';
  const header = [
    'Anda adalah analis pengendalian internal ICOFR untuk BUMN Indonesia (Regulasi SK-5/DKU.MBU/11/2024, Lampiran 2 klaster risiko & Lampiran 3 semantik langkah BPM).',
    'Tugas: usulkan TEPAT 3 kandidat dalam Bahasa Indonesia.',
    '',
    'Konteks:',
    `- ${glLine}`,
    `- Proses BPM: ${ctx.bpmName}`,
    `- Langkah/Simpul BPM: ${ctx.nodeLabel}`,
  ];
  if (kind === 'risk') {
    return [
      ...header,
      '',
      'Usulkan 3 risiko pelaporan keuangan (assertion-level: completeness, accuracy, validity, presentation) yang mungkin terjadi pada langkah tersebut.',
      'JANGAN sertakan angka materialitas, JANGAN mengarang kode akun, JANGAN beri saran generik yang berlaku untuk semua proses.',
      'Balas HANYA dengan JSON valid berbentuk {"items":[{"description":"...","rationale":"..."}]} tanpa teks lain.',
    ].join('\n');
  }
  return [
    ...header,
    `- Risiko terpilih: ${ctx.riskDescription}`,
    '',
    'Usulkan 3 aktivitas pengendalian (preventif/detektif, manual/otomatis) yang secara langsung memitigasi risiko terpilih pada langkah tersebut.',
    'JANGAN sertakan angka materialitas, JANGAN mengarang kode kontrol, JANGAN beri saran generik yang berlaku untuk semua proses.',
    'Balas HANYA dengan JSON valid berbentuk {"items":[{"description":"...","rationale":"..."}]} tanpa teks lain.',
  ].join('\n');
}

function sanitizeItem(raw: unknown): SuggestionItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const { description, rationale } = raw as { description?: unknown; rationale?: unknown };
  const desc = asTrimmedString(description);
  if (!desc) return null;
  return {
    description: truncate(desc, MAX_DESCRIPTION_LENGTH),
    rationale: truncate(asTrimmedString(rationale), MAX_RATIONALE_LENGTH),
  };
}

/** Parses raw LLM output into a SuggestResult. Pure: no network. Never throws on model output. */
export function parseSuggestResponse(raw: string, kind: SuggestKind): SuggestResult {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(jsonrepair(raw));
  } catch {
    return { kind, items: [], emptyReason: 'MODEL_INVALID_JSON' };
  }
  const items = Array.isArray((parsed as { items?: unknown })?.items)
    ? (parsed as { items: unknown[] }).items
    : [];
  const clean = items
    .map(sanitizeItem)
    .filter((item): item is SuggestionItem => item !== null)
    .slice(0, MAX_SUGGESTIONS);
  return {
    kind,
    items: clean,
    emptyReason: clean.length === 0 ? 'MODEL_EMPTY' : null,
  };
}

export type GenerateFn = (prompt: string) => Promise<string>;

/**
 * Orchestrates one suggestion round. Pure except for the injected `generate`.
 * Gating delegates wholly to the shared `suggestGate` seam, so the worker and
 * the client adapter block on identical reasons without calling the LLM.
 */
export async function suggestRiskControls(
  body: unknown,
  kind: SuggestKind,
  generate: GenerateFn,
): Promise<SuggestResult> {
  const ctx = validateSuggestInput(body, kind);
  const gate = suggestGate({
    kind,
    bpmName: ctx.bpmName,
    nodeLabel: ctx.nodeLabel,
    riskDescription: ctx.riskDescription,
  });
  if (gate.blocked) {
    return { kind, items: [], emptyReason: gate.reason };
  }
  const raw = await generate(buildSuggestPrompt(ctx, kind));
  return parseSuggestResponse(raw, kind);
}
