// ocr-node-box.ts — rendered-size estimate for OCR layout (pure TS, no DOM).
//
// Why this exists: the node registry stores the *minimum* box per type, but the
// activity renderer grows with a wrapped label (role row + wrapped lines). The
// OCR layout reserves vertical space from these numbers, so using the registry
// height alone let a 97px node sit 29px above its successor.
//
// Measurement is deliberately not used: layout runs in `stageRawDiagram` before
// render, and jsdom reports zero layout, so a DOM measurement would make the
// result non-deterministic and untestable.

import { nodeDimensionsOf, type NodeDimension } from '@shared/bpm-node-registry';

/** Label metrics mirrored from the 12px semibold activity renderer. */
const AVG_CHAR_PX = 6.6;
const HORIZONTAL_PADDING_PX = 32;
/** Extra height each additional wrapped line adds (registry height covers line 1). */
const EXTRA_LINE_PX = 20;

/**
 * Types whose renderer grows vertically with the label. Every other type keeps a
 * fixed box (decision diamond, archive, document, terminators, …), so the
 * registry height is already the rendered height.
 */
const WRAPPING_TEXT_BOX_TYPES: ReadonlySet<string> = new Set(['activity', 'external-process']);

function estimateTextLineCount(label: string, boxWidth: number): number {
  const contentWidth = Math.max(AVG_CHAR_PX, boxWidth - HORIZONTAL_PADDING_PX);
  const maxChars = Math.max(1, Math.floor(contentWidth / AVG_CHAR_PX));
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;

  let lines = 1;
  let current = 0;
  for (const word of words) {
    const candidate = current === 0 ? word.length : current + 1 + word.length;
    if (current === 0 || candidate <= maxChars) {
      current = candidate;
      continue;
    }
    lines += 1;
    current = word.length;
  }
  return lines;
}

/** Rendered box for a node type + label, never smaller than the registry box. */
export function estimateNodeBox(type: string, label: string): NodeDimension {
  const base = nodeDimensionsOf(type);
  if (!WRAPPING_TEXT_BOX_TYPES.has(type)) return base;

  const lines = estimateTextLineCount(label, base.width);
  return { width: base.width, height: base.height + (lines - 1) * EXTRA_LINE_PX };
}
