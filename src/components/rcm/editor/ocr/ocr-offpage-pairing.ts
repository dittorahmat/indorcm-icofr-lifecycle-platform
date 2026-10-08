// Off-page connector pairing for OCR multi-sheet imports.
// Owns the Ke-hal/Dari-hal 1-based page-link regexes (behavior byte-identical
// to the former connector-link-matcher) behind a node-level resolver, so both
// the OCR adapter and the legacy sheet matcher share one locality.

export interface OffPageSheetRef {
  id: string;
  name: string;
}

export type OffPageLink =
  | { direction: 'out'; targetSheetId: string; targetSheetName: string }
  | { direction: 'in'; sourceSheetId: string; sourceSheetName: string };

// Matches "Ke hal 2", "Ke hal. 2", "Ke halaman 2", "Ke Sheet 2", "To page 2".
const TARGET_PAGE_PATTERN = /(?:ke\s*hal(?:aman)?\.?|to\s*page|ke\s*sheet)\s*(\d+)/i;
// Matches "Dari hal 1", "Dari halaman 1", "From page 1".
const SOURCE_PAGE_PATTERN = /(?:dari\s*hal(?:aman)?\.?|from\s*page)\s*(\d+)/i;

function resolvePageNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function resolveOffPageLink(
  label: unknown,
  selfId: string,
  resolvePage: (page: number) => OffPageSheetRef | undefined,
): OffPageLink | null {
  if (typeof label !== 'string' || label.length === 0) return null;

  const outgoing = label.match(TARGET_PAGE_PATTERN);
  const outgoingPage = resolvePageNumber(outgoing?.[1]);
  if (outgoingPage !== null) {
    const target = resolvePage(outgoingPage);
    if (target && target.id !== selfId) {
      return { direction: 'out', targetSheetId: target.id, targetSheetName: target.name };
    }
  }

  const incoming = label.match(SOURCE_PAGE_PATTERN);
  const incomingPage = resolvePageNumber(incoming?.[1]);
  if (incomingPage !== null) {
    const source = resolvePage(incomingPage);
    if (source && source.id !== selfId) {
      return { direction: 'in', sourceSheetId: source.id, sourceSheetName: source.name };
    }
  }

  return null;
}
