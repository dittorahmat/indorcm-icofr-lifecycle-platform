import type { Edge, Node } from 'reactflow';
import { calculateAppendOffset, remapElementsForAppend } from '@/utils/bpm-ocr-append';
import { resolveOffPageLink } from './ocr-offpage-pairing';
import type { OcrAppendDirection, OcrImportMode, OcrStagedPage, OcrStagedPages } from './ocr-types';

export type { OcrStagedPage, OcrStagedPages };

// Single OCR-import adapter: layout → stage → append/remap → sheets+pairing.
// BPMEditor talks to this one interface, so the staging preview and the
// canvas landing share a single normalization and stable identities.

export interface OcrImportSheet {
  id: string;
  name: string;
  order: number;
  nodes: Node[];
  edges: Edge[];
}

export interface BuildOcrSheetsInput {
  pages: OcrStagedPages;
  activePage: number;
  activeNodes: Node[];
  activeEdges: Edge[];
  formatSheetName?: (page: number) => string;
}

export interface ApplyOcrImportInput {
  stagedNodes: Node[];
  stagedEdges: Edge[];
  mode: OcrImportMode;
  direction: OcrAppendDirection;
  existingNodes: Node[];
  existingEdges?: Edge[];
  pages?: OcrStagedPages;
  activePage?: number;
  idPrefix?: string;
  formatSheetName?: (page: number) => string;
}

export type ApplyOcrImportOutput =
  | { kind: 'sheets'; sheets: OcrImportSheet[] }
  | { kind: 'canvas'; nodes: Node[]; edges: Edge[] };

export function ocrSheetIdForPage(page: number): string {
  return `ocr-sheet-page-${page}`;
}

function defaultSheetName(page: number): string {
  return `Fase ${page} (Halaman ${page})`;
}

function entriesOf(pages: OcrStagedPages): Array<[number, OcrStagedPage]> {
  const list =
    pages instanceof Map
      ? [...pages.entries()]
      : Object.entries(pages).map(([key, value]) => [Number(key), value] as [number, OcrStagedPage]);
  return list.sort((a, b) => a[0] - b[0]);
}

function pageCountOf(pages: OcrStagedPages | undefined): number {
  if (!pages) return 0;
  return pages instanceof Map ? pages.size : Object.keys(pages).length;
}

export function buildOcrSheets(input: BuildOcrSheetsInput): OcrImportSheet[] {
  const format = input.formatSheetName ?? defaultSheetName;
  // Flush the review page under edit: the reviewer may apply without
  // switching pages, so the live staging state always wins over the map.
  const flushed = new Map(entriesOf(input.pages));
  flushed.set(input.activePage, { nodes: input.activeNodes, edges: input.activeEdges });
  const ordered = [...flushed.entries()].sort((a, b) => a[0] - b[0]);
  const sheets: OcrImportSheet[] = ordered.map(([page, data], index) => ({
    id: ocrSheetIdForPage(page),
    name: format(page),
    order: index,
    nodes: data.nodes ?? [],
    edges: data.edges ?? [],
  }));
  if (sheets.length <= 1) return sheets;
  const byPage = new Map(sheets.map((sheet, index) => [index + 1, sheet] as const));
  return sheets.map((sheet) => ({
    ...sheet,
    nodes: sheet.nodes.map((node) => {
      if (node.type !== 'off-page-ref') return node;
      const link = resolveOffPageLink(node.data?.label, sheet.id, (page) => byPage.get(page));
      if (!link) return node;
      return { ...node, data: { ...node.data, ...link } };
    }),
  }));
}

export function applyOcrImport(input: ApplyOcrImportInput): ApplyOcrImportOutput {
  if (input.pages && pageCountOf(input.pages) > 1) {
    const firstPage = entriesOf(input.pages)[0]?.[0] ?? 1;
    return {
      kind: 'sheets',
      sheets: buildOcrSheets({
        pages: input.pages,
        activePage: input.activePage ?? firstPage,
        activeNodes: input.stagedNodes,
        activeEdges: input.stagedEdges,
        formatSheetName: input.formatSheetName,
      }),
    };
  }
  if (input.mode === 'append' && input.existingNodes.length > 0) {
    const offset = calculateAppendOffset({
      direction: input.direction,
      existingNodes: input.existingNodes,
      newNodes: input.stagedNodes,
    });
    const remapped = input.idPrefix
      ? remapElementsForAppend(input.stagedNodes, input.stagedEdges, offset, input.idPrefix)
      : remapElementsForAppend(input.stagedNodes, input.stagedEdges, offset);
    return {
      kind: 'canvas',
      nodes: [...input.existingNodes, ...remapped.nodes],
      edges: [...(input.existingEdges ?? []), ...remapped.edges],
    };
  }
  return { kind: 'canvas', nodes: [...input.stagedNodes], edges: [...input.stagedEdges] };
}
