import type { Edge, Node } from 'reactflow';
import { sanitizeEdgesForSave, sanitizeNodesForSave } from '../utils/sanitize-bpm-nodes';

/**
 * bpm-diagram-projection — the pure projections of a diagram editor session.
 *
 * The editor answered "what will we save?" and "has anything changed?" in two
 * places that each re-derived the sign-off block field by field: the state
 * hook's loader effect and its `isDirty` memo. They had to be kept in step by
 * hand, and nothing tested either. Both now cross this seam, so the sign-off
 * fallback chain (saved → workflow history → author) has one implementation.
 *
 * Pure: no React, no i18n, no network. `isDirty`'s comparison set is pinned by
 * `bpm-diagram-projection.test.ts` — changing what counts as a change is a
 * product decision, not a refactor.
 */

/** The six sign-off fields the accountability block prints. */
export interface DiagramSignatures {
  lini1Name: string;
  lini1Date: string;
  lini2Name: string;
  lini2Date: string;
  cfoName: string;
  cfoDate: string;
}

export const SIGNATURE_FIELDS: readonly (keyof DiagramSignatures)[] = [
  'lini1Name',
  'lini1Date',
  'lini2Name',
  'lini2Date',
  'cfoName',
  'cfoDate',
];

export interface WorkflowHistoryLike {
  action?: string;
  userId?: string;
  timestamp?: number;
}

export interface SignatureProjectionInput {
  /** Signatures explicitly stored on the diagram — these always win. */
  saved?: Partial<DiagramSignatures> | null;
  workflowHistory?: readonly WorkflowHistoryLike[] | null;
  createdBy?: string | null;
  resolveUserName: (userId: string) => string;
  formatDate: (timestamp: number | undefined) => string;
}

/**
 * Signatures for a diagram: stored values win, otherwise fall back to whichever
 * workflow action named a signer, otherwise to the author (Line 1 only).
 */
export function projectSignatures(input: SignatureProjectionInput): DiagramSignatures {
  const saved = input.saved ?? {};
  const history = input.workflowHistory ?? [];
  const actionOf = (action: string) => history.find((entry) => entry.action === action);
  const submit = actionOf('Submit');
  const review = actionOf('Review');
  const approve = actionOf('Approve');

  return {
    lini1Name:
      saved.lini1Name ??
      (submit?.userId ? input.resolveUserName(submit.userId) : input.resolveUserName(input.createdBy ?? '')),
    lini1Date: saved.lini1Date ?? (submit ? input.formatDate(submit.timestamp) : ''),
    lini2Name: saved.lini2Name ?? (review?.userId ? input.resolveUserName(review.userId) : ''),
    lini2Date: saved.lini2Date ?? (review ? input.formatDate(review.timestamp) : ''),
    cfoName: saved.cfoName ?? (approve?.userId ? input.resolveUserName(approve.userId) : ''),
    cfoDate: saved.cfoDate ?? (approve ? input.formatDate(approve.timestamp) : ''),
  };
}

/**
 * The node/edge shape `isDirty` compares. Geometry and label edits count;
 * selection, dimensions and handle repair deliberately do not.
 */
export function comparableDiagramNodes(nodes: readonly Node[]): string {
  return JSON.stringify(nodes.map((n) => ({ id: n.id, position: n.position, data: n.data })));
}

export function comparableDiagramEdges(edges: readonly Edge[]): string {
  return JSON.stringify(edges.map((e) => ({ id: e.id, source: e.source, target: e.target })));
}

export interface BpmSavePayload {
  nodes: ReturnType<typeof sanitizeNodesForSave>;
  edges: ReturnType<typeof sanitizeEdgesForSave>;
  name: string;
  subProcess: string;
  year: number;
  noGLs: string[];
  metadata: {
    signatures: Record<string, string>;
    globalScale: number;
    sheets?: unknown[];
    activeSheetId?: string;
  };
}

export interface DiagramSaveInput {
  nodes: Node[];
  edges: Edge[];
  subProcess: string;
  diagramYear?: number;
  workingYear: string;
  selectedGLs: string[];
  diagramMetadata?: Record<string, unknown>;
  signatures: Record<string, string>;
  globalScale: number;
  sheets?: unknown[];
  activeSheetId?: string;
}

/** The body `PUT /api/bpm-diagrams/:id` receives. */
export function projectDiagramSavePayload(input: DiagramSaveInput): BpmSavePayload {
  return {
    nodes: sanitizeNodesForSave(input.nodes),
    edges: sanitizeEdgesForSave(input.edges),
    name: input.subProcess,
    subProcess: input.subProcess,
    year: input.diagramYear || parseInt(input.workingYear),
    noGLs: input.selectedGLs,
    metadata: {
      ...input.diagramMetadata,
      signatures: input.signatures,
      globalScale: input.globalScale,
      sheets: input.sheets,
      activeSheetId: input.activeSheetId,
    },
  };
}
