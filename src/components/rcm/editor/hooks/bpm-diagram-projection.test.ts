import { describe, expect, it } from 'vitest';
import type { Edge, Node } from 'reactflow';
import {
  SIGNATURE_FIELDS,
  comparableDiagramEdges,
  comparableDiagramNodes,
  projectDiagramSavePayload,
  projectSignatures,
} from './bpm-diagram-projection';

/**
 * These pin the editor's *behaviour*, not its structure: what counts as a
 * signature, what counts as an unsaved change, and what the save call sends.
 * `useBPMEditor.test.tsx` only asserted the hook's namespaces existed, which is
 * how the sign-off block came to be duplicated field-by-field in two places.
 */

const node = (id: string, x = 0, data: Record<string, unknown> = {}): Node => ({
  id,
  type: 'activity',
  position: { x, y: 0 },
  data,
});

const edge = (id: string, source: string, target: string): Edge => ({ id, source, target });

// Mirrors the hook's `getUserName`: an empty id resolves to an empty name, not
// to a prefixed empty string.
const resolveUserName = (userId: string) => (userId ? `user:${userId}` : '');
const formatDate = (timestamp: number | undefined) => (timestamp === undefined ? '' : `date:${timestamp}`);

describe('projectSignatures', () => {
  it('lets stored signatures win over the workflow history', () => {
    expect(
      projectSignatures({
        saved: { lini1Name: 'Stored L1', cfoDate: '01/02/2024' },
        workflowHistory: [
          { action: 'Submit', userId: 'u1', timestamp: 111 },
          { action: 'Approve', userId: 'u3', timestamp: 333 },
        ],
        createdBy: 'author',
        resolveUserName,
        formatDate,
      }),
    ).toEqual({
      lini1Name: 'Stored L1',
      lini1Date: 'date:111',
      lini2Name: '',
      lini2Date: '',
      cfoName: 'user:u3',
      cfoDate: '01/02/2024',
    });
  });

  it('derives each line from its own workflow action', () => {
    expect(
      projectSignatures({
        workflowHistory: [
          { action: 'Submit', userId: 'u1', timestamp: 111 },
          { action: 'Review', userId: 'u2', timestamp: 222 },
          { action: 'Approve', userId: 'u3', timestamp: 333 },
        ],
        createdBy: 'author',
        resolveUserName,
        formatDate,
      }),
    ).toEqual({
      lini1Name: 'user:u1',
      lini1Date: 'date:111',
      lini2Name: 'user:u2',
      lini2Date: 'date:222',
      cfoName: 'user:u3',
      cfoDate: 'date:333',
    });
  });

  it('falls back to the diagram author for Line 1 only', () => {
    expect(
      projectSignatures({ createdBy: 'author-9', resolveUserName, formatDate }),
    ).toEqual({
      lini1Name: 'user:author-9',
      lini1Date: '',
      lini2Name: '',
      lini2Date: '',
      cfoName: '',
      cfoDate: '',
    });
  });

  it('renders every field empty when there is no history and no author', () => {
    const signatures = projectSignatures({ resolveUserName, formatDate });
    expect(SIGNATURE_FIELDS.map((field) => signatures[field])).toEqual(['', '', '', '', '', '']);
  });

  it('keeps an explicitly empty stored signature instead of re-deriving it', () => {
    // `?? ` must not fall through on '' — an explicitly cleared signature stays cleared.
    const signatures = projectSignatures({
      saved: { lini1Name: '' },
      workflowHistory: [{ action: 'Submit', userId: 'u1', timestamp: 111 }],
      resolveUserName,
      formatDate,
    });
    expect(signatures.lini1Name).toBe('');
  });

  it('uses the first matching workflow action', () => {
    const signatures = projectSignatures({
      workflowHistory: [
        { action: 'Submit', userId: 'first', timestamp: 1 },
        { action: 'Submit', userId: 'second', timestamp: 2 },
      ],
      resolveUserName,
      formatDate,
    });
    expect(signatures.lini1Name).toBe('user:first');
    expect(signatures.lini1Date).toBe('date:1');
  });
});

describe('comparableDiagramNodes / comparableDiagramEdges (the isDirty comparison set)', () => {
  it('sees a moved node', () => {
    expect(comparableDiagramNodes([node('a', 0)])).not.toBe(comparableDiagramNodes([node('a', 10)]));
  });

  it('sees a data edit', () => {
    expect(comparableDiagramNodes([node('a', 0, { label: 'A' })])).not.toBe(
      comparableDiagramNodes([node('a', 0, { label: 'B' })]),
    );
  });

  it('ignores everything outside id, position and data', () => {
    const plain = node('a');
    const decorated: Node = { ...plain, selected: true, zIndex: 20, draggable: false, width: 200 };
    expect(comparableDiagramNodes([plain])).toBe(comparableDiagramNodes([decorated]));
  });

  it('sees an added node and a re-pointed edge', () => {
    expect(comparableDiagramNodes([])).not.toBe(comparableDiagramNodes([node('a')]));
    expect(comparableDiagramEdges([edge('e1', 'a', 'b')])).not.toBe(
      comparableDiagramEdges([edge('e1', 'a', 'c')]),
    );
  });

  it('ignores edge styling and handles', () => {
    const bare = edge('e1', 'a', 'b');
    const routed: Edge = { ...bare, sourceHandle: 'bottom', type: 'bridge', animated: true };
    expect(comparableDiagramEdges([bare])).toBe(comparableDiagramEdges([routed]));
  });
});

describe('projectDiagramSavePayload', () => {
  it('builds the PUT body, stripping canvas callbacks and hydrating metadata', () => {
    const payload = projectDiagramSavePayload({
      nodes: [node('a', 5, { label: 'Step', onToggleLock: () => undefined, empty: undefined })],
      edges: [edge('e1', 'a', 'b')],
      subProcess: 'Penerimaan Kas',
      diagramYear: 2025,
      workingYear: '2026',
      selectedGLs: ['1010', '1020'],
      diagramMetadata: { createdFrom: 'ocr' },
      signatures: { lini1Name: 'Signed L1' },
      globalScale: 90,
      sheets: [{ id: 'sheet-1' }],
      activeSheetId: 'sheet-1',
    });

    expect(payload.name).toBe('Penerimaan Kas');
    expect(payload.subProcess).toBe('Penerimaan Kas');
    // The diagram's own year wins over the working year.
    expect(payload.year).toBe(2025);
    expect(payload.noGLs).toEqual(['1010', '1020']);
    expect(payload.nodes[0]).toMatchObject({ id: 'a', type: 'activity', position: { x: 5, y: 0 } });
    expect(payload.nodes[0].data).toEqual({ label: 'Step' });
    expect(payload.metadata).toEqual({
      createdFrom: 'ocr',
      signatures: { lini1Name: 'Signed L1' },
      globalScale: 90,
      sheets: [{ id: 'sheet-1' }],
      activeSheetId: 'sheet-1',
    });
  });

  it('falls back to the working year for an unsaved diagram', () => {
    const payload = projectDiagramSavePayload({
      nodes: [],
      edges: [],
      subProcess: 'S',
      workingYear: '2026',
      selectedGLs: [],
      signatures: {},
      globalScale: 100,
    });
    expect(payload.year).toBe(2026);
    expect(payload.metadata.globalScale).toBe(100);
  });

  it('does not mutate its inputs', () => {
    const nodes = [node('a', 5, { label: 'Step' })];
    const snapshot = JSON.parse(JSON.stringify(nodes));
    projectDiagramSavePayload({
      nodes,
      edges: [],
      subProcess: 'S',
      workingYear: '2026',
      selectedGLs: [],
      signatures: {},
      globalScale: 100,
    });
    expect(nodes).toEqual(snapshot);
  });

  it('strips callbacks from nested data and its arrays', () => {
    const payload = projectDiagramSavePayload({
      nodes: [
        node('a', 0, {
          label: 'Step',
          regulatoryPairs: [{ riskId: 'R-1', onRemove: () => undefined }],
          onResizeEnd: () => undefined,
        }),
      ],
      edges: [],
      subProcess: 'S',
      workingYear: '2026',
      selectedGLs: [],
      signatures: {},
      globalScale: 100,
    });
    expect(payload.nodes[0].data).toEqual({
      label: 'Step',
      regulatoryPairs: [{ riskId: 'R-1' }],
    });
  });
});
