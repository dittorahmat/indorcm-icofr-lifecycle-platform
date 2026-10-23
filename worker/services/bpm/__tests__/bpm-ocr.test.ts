import { describe, it, expect } from 'vitest';
import {
  BPM_OCR_AI_FAILED,
  BPM_OCR_NODE_TYPE_ENUM,
  BPM_OCR_RESPONSE_SCHEMA,
  BPM_OCR_SYSTEM_INSTRUCTION,
  BPM_OCR_UNPARSEABLE,
  OCR_EXCLUDED_NODE_TYPES,
  buildOcrPrompt,
  parseOcrResponse,
} from '../bpm-ocr';
import { AppError } from '../../../lib/utils';

/**
 * The OCR enum was hand-copied and drifted six members short of
 * `BPMNode['type']`. These are known-good literals (independent of the
 * implementation) so the parity assertion can actually disagree with the code.
 */
const EXPECTED_OCR_ENUM = [
  'start',
  'end',
  'activity',
  'automated-activity',
  'decision',
  'document',
  'archive',
  'swimlane',
  'reference',
  'manual-input',
  'external-process',
  'data-media',
  'alternate-process',
  'data',
  'predefined-process',
  'internal-storage',
  'multi-document',
  'preparation',
  'manual-operation',
  'card',
  'punched-tape',
  'summing-junction',
  'or',
  'collate',
  'sort',
  'extract',
  'merge',
  'stored-data',
  'delay',
  'sequential-access',
  'direct-access',
  'display',
  'loop-limit',
  'annotation',
];

const EXPECTED_EXCLUSIONS = [
  'system',
  'risk',
  'control',
  'docked-risk',
  'docked-control',
  'off-page-ref',
];

describe('buildOcrPrompt', () => {
  it('sends the diagram-classification vocabulary in the system instruction', () => {
    const { systemInstruction } = buildOcrPrompt({ image: 'data:image/png;base64,AAAA' });

    expect(systemInstruction).toBe(BPM_OCR_SYSTEM_INSTRUCTION);
    for (const shape of [
      '"multi-document"',
      '"swimlane"',
      '"manual-operation"',
      '"automated-activity"',
      '"data-media"',
      '"decision"',
    ]) {
      expect(systemInstruction).toContain(shape);
    }
  });

  it('locks the geometry contract: top-left positions, sizes, and no reflow', () => {
    const { systemInstruction } = buildOcrPrompt({ image: 'data:image/png;base64,AAAA' });

    expect(systemInstruction).toContain('sudut KIRI-ATAS');
    expect(systemInstruction).toContain('JANGAN merapikan (reflow)');
    expect(systemInstruction).toContain('"width" dan "height"');
    expect(systemInstruction).toContain('selisih maksimal 20 poin');
  });

  it('extracts at temperature 0 so one drawing yields one set of connectors', () => {
    const prompt = buildOcrPrompt({ image: 'data:image/png;base64,AAAA' });

    expect(prompt.temperature).toBe(0);
  });

  it('attaches the image as a multimodal user message', () => {
    const prompt = buildOcrPrompt({ image: 'data:image/png;base64,ZZZZ' });

    expect(prompt.messages).toHaveLength(1);
    expect(prompt.messages[0].role).toBe('user');
    expect(prompt.messages[0].content[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/png;base64,ZZZZ' },
    });
  });
});

describe('BPM_OCR_RESPONSE_SCHEMA', () => {
  it('derives the node-type enum from the runtime source minus the exclusions', () => {
    const nodeSchema = BPM_OCR_RESPONSE_SCHEMA.properties.nodes.items.properties.type;

    expect(nodeSchema.enum).toEqual(EXPECTED_OCR_ENUM);
    expect([...BPM_OCR_NODE_TYPE_ENUM]).toEqual(EXPECTED_OCR_ENUM);
  });

  it('states the six editor-only exclusions once', () => {
    expect([...OCR_EXCLUDED_NODE_TYPES]).toEqual(EXPECTED_EXCLUSIONS);
  });

  it('requests optional source/target handles on edges', () => {
    const edgeProps = BPM_OCR_RESPONSE_SCHEMA.properties.edges.items.properties;

    expect(edgeProps.sourceHandle).toBeDefined();
    expect(edgeProps.targetHandle).toBeDefined();
    // Optional: a response without handles must still parse (backward compatible).
    expect(BPM_OCR_RESPONSE_SCHEMA.properties.edges.items.required).toEqual(['id', 'source', 'target']);
  });
});

describe('parseOcrResponse', () => {
  it('parses a clean JSON object', () => {
    const diagram = parseOcrResponse(
      JSON.stringify({
        nodes: [{ id: 'n1', type: 'start', label: 'Mulai', position: { x: 1, y: 2 } }],
        edges: [{ id: 'e1', source: 'n1', target: 'n1', label: 'ya' }],
      }),
    );

    expect(diagram.nodes).toEqual([
      { id: 'n1', type: 'start', label: 'Mulai', position: { x: 1, y: 2 } },
    ]);
    expect(diagram.edges).toEqual([{ id: 'e1', source: 'n1', target: 'n1', label: 'ya' }]);
  });

  it('unwraps a fenced ```json block', () => {
    const diagram = parseOcrResponse(
      '```json\n{"nodes":[{"id":"n1","type":"activity","label":"A","position":{"x":0,"y":0}}],"edges":[]}\n```',
    );

    expect(diagram.nodes).toHaveLength(1);
    expect(diagram.nodes[0].type).toBe('activity');
    expect(diagram.edges).toEqual([]);
  });

  it('repairs JSON wrapped in prose', () => {
    const diagram = parseOcrResponse(
      'Berikut hasilnya: {"nodes":[{"id":"n1","type":"decision","label":"Setuju?","position":{"x":5,"y":6}}],"edges":[]} Semoga membantu.',
    );

    expect(diagram.nodes).toHaveLength(1);
    expect(diagram.nodes[0].type).toBe('decision');
  });

  it('repairs a response truncated mid-property', () => {
    const diagram = parseOcrResponse(
      '{"nodes":[{"id":"n1","type":"start","label":"Mulai","position":{"x":0,"y":0}},{"id":"n2","type":"activity","label":"Proses","position":{"x":10,"y":20}}],"edges":[{"id":"e1","source":"n1","target":"n2","label":"',
    );

    expect(diagram.nodes.map((n) => n.id)).toEqual(['n1', 'n2']);
    expect(Array.isArray(diagram.edges)).toBe(true);
  });

  it('coerces an unknown node type to activity instead of passing it through', () => {
    const diagram = parseOcrResponse(
      '{"nodes":[{"id":"n1","type":"totally-made-up","label":"X","position":{"x":0,"y":0}}],"edges":[]}',
    );

    expect(diagram.nodes[0].type).toBe('activity');
  });

  it('keeps editor-owned types that are valid union members', () => {
    const diagram = parseOcrResponse(
      '{"nodes":[{"id":"n1","type":"risk","label":"Risiko","position":{"x":0,"y":0}}],"edges":[]}',
    );

    expect(diagram.nodes[0].type).toBe('risk');
  });

  it('drops non-record node/edge entries and defaults a missing position', () => {
    const diagram = parseOcrResponse(
      '{"nodes":[null,42,{"id":"n1","type":"activity","label":"A"}],"edges":["nope",{"id":"e1","source":"n1","target":"n1"}]}',
    );

    expect(diagram.nodes).toEqual([
      { id: 'n1', type: 'activity', label: 'A', position: { x: 0, y: 0 } },
    ]);
    expect(diagram.edges).toEqual([{ id: 'e1', source: 'n1', target: 'n1' }]);
  });

  it('normalizes a non-object document to an empty diagram', () => {
    expect(parseOcrResponse('"just a string"')).toEqual({ nodes: [], edges: [] });
    expect(parseOcrResponse('123')).toEqual({ nodes: [], edges: [] });
    expect(parseOcrResponse('[1,2,3]')).toEqual({ nodes: [], edges: [] });
    expect(parseOcrResponse('this is not json at all')).toEqual({ nodes: [], edges: [] });
  });

  it('normalizes missing node/edge arrays to empty arrays', () => {
    expect(parseOcrResponse('{"nodes":"x","edges":7}')).toEqual({ nodes: [], edges: [] });
  });

  it('keeps model-supplied edge handles when present', () => {
    const diagram = parseOcrResponse(
      '{"nodes":[],"edges":[{"id":"e1","source":"a","target":"b","sourceHandle":"bottom","targetHandle":"top"}]}',
    );

    expect(diagram.edges).toEqual([
      { id: 'e1', source: 'a', target: 'b', sourceHandle: 'bottom', targetHandle: 'top' },
    ]);
  });

  it('throws the unparseable seam code when every repair stage fails', () => {
    for (const broken of ['', '{{', '<html>oops</html>']) {
      let caught: unknown;
      try {
        parseOcrResponse(broken);
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(AppError);
      if (!(caught instanceof AppError)) throw new Error('expected AppError');
      expect(caught.code).toBe('BPM_OCR_UNPARSEABLE');
      expect(caught.code).toBe(BPM_OCR_UNPARSEABLE);
      expect(caught.status).toBe(502);
    }
  });

  it('exposes a distinct seam code for upstream AI failures', () => {
    expect(BPM_OCR_AI_FAILED).toBe('BPM_OCR_AI_FAILED');
    expect(BPM_OCR_AI_FAILED).not.toBe(BPM_OCR_UNPARSEABLE);
  });
});
