// @vitest-environment node
// End-to-end OCR verification against the real KUR PDF.
//
// Reuses the production path instead of re-implementing it:
//   pdfjs (the engine `diagram-parser.ts` uses in the browser, here its Node
//   build + @napi-rs/canvas)
//   -> buildOcrPrompt / BPM_OCR_RESPONSE_SCHEMA / parseOcrResponse (worker seam)
//   -> AIService (same Gemini call the POST /api/bpm-diagrams/ocr route makes)
//   -> layoutOcrDiagram -> auditOcrLayout
//
// Skipped unless `OCR_LIVE=1` (so `npm test` never calls the model) and a PDF
// (or PNG/JPG export) plus a Gemini key are available. Run it with:
//   $env:OCR_LIVE="1"; npx vitest run src/test/ocr-pdf-e2e.test.ts --disable-console-intercept
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

import { AIService } from '../../worker/services/ai-service';
import {
  BPM_OCR_RESPONSE_SCHEMA,
  buildOcrPrompt,
  parseOcrResponse,
} from '../../worker/services/bpm/bpm-ocr';
import { layoutOcrDiagram } from '../utils/ocr-layout';
import { auditOcrLayout, auditSourceOrder } from '../utils/ocr-layout-audit';

function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = {
  ...readEnvFile(resolve(process.cwd(), '.env')),
  ...readEnvFile(resolve(process.cwd(), '.dev.vars')),
  ...process.env,
};

const pdfPath = resolve(process.cwd(), env.OCR_PDF_PATH ?? 'fixtures/BPM_Persetujuaan_Kredit_KUR_20260831.pdf');
const imagePath = env.OCR_IMAGE_PATH ? resolve(process.cwd(), env.OCR_IMAGE_PATH) : '';
const sourcePath = existsSync(pdfPath) ? pdfPath : imagePath && existsSync(imagePath) ? imagePath : '';
const apiKey = env.GEMINI_API_KEY ?? '';
const canRun = env.OCR_LIVE === '1' && sourcePath !== '' && apiKey.length > 0;

/** Page 1 of a PDF as PNG bytes, using pdfjs's Node canvas path. */
async function pdfPageToPng(path: string): Promise<Uint8Array> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)), isEvalSupported: false }).promise;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const canvasContext = canvas.getContext('2d');
    // @ts-expect-error boundary: pdfjs types the target as the DOM 2D context,
    // while @napi-rs/canvas supplies the same surface to its own NodeCanvasFactory.
    await page.render({ canvasContext, viewport }).promise;
    return new Uint8Array(canvas.toBuffer('image/png'));
  } finally {
    await doc.destroy();
  }
}

/** PDF page 1 (pdfjs) or a PNG/JPG export of the same page. */
async function sourceToImageDataUrl(path: string): Promise<string> {
  if (/\.pdf$/i.test(path)) {
    const png = await pdfPageToPng(path);
    return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
  }
  const mime = /\.jpe?g$/i.test(path) ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${readFileSync(path).toString('base64')}`;
}

describe.skipIf(!canRun)('OCR end-to-end — KUR drawing', () => {
  it(
    'extracts the drawing, lays it out, and passes the geometry audit',
    async () => {
      const { systemInstruction, messages, temperature } = buildOcrPrompt({ image: await sourceToImageDataUrl(sourcePath) });

      const ai = new AIService({
        provider: 'gemini',
        apiKey,
        chatModel: env.AI_CHAT_MODEL,
        embeddingModel: env.AI_EMBEDDING_MODEL,
      });
      const response = await ai.generateChatResponse({
        systemInstruction,
        messages,
        temperature,
        responseSchema: BPM_OCR_RESPONSE_SCHEMA,
      });

      const diagram = parseOcrResponse(response.content ?? '');
      expect(diagram.nodes.length).toBeGreaterThan(0);
      // `OCR_DUMP=<path>` saves the raw response so layout can be replayed offline.
      if (env.OCR_DUMP) writeFileSync(resolve(process.cwd(), env.OCR_DUMP), JSON.stringify(diagram, null, 2));

      // Content checks are anchored per drawing: the KUR sheet has its own label
      // set, other sheets only get structural expectations. Wording is the
      // model's job and varies, so coverage is scored instead of exact-matched.
      const isKur = /KUR/i.test(sourcePath);
      const lanes = diagram.nodes.filter((node) => node.type === 'swimlane');
      const laneLabels = lanes.map((node) => `${node.label}/${node.department ?? ''}`);
      const labels = diagram.nodes.map((node) => `${node.label} ${node.department ?? ''}`.toUpperCase());

      const expected = isKur
        ? [
            'KOMITE KREDIT',
            'MARKETING',
            'CALON DEBITUR',
            'LEGAL',
            'MENERIMA USULAN KREDIT',
            'PERTIMBANGAN',
            'OFFERING LETTER',
            'SELESAI',
          ]
        : [];
      // Sheets without real swimlanes (a flow plus a sign-off table) are valid:
      // only the KUR drawing has the four lane columns.
      if (isKur) expect(lanes.length).toBe(4);
      expect(diagram.nodes.length).toBeGreaterThanOrEqual(3);
      const missing = expected.filter((item) => !labels.some((label) => label.includes(item)));
      const coverage = expected.length === 0 ? 1 : (expected.length - missing.length) / expected.length;
      const minimumEdges = isKur ? 8 : 1;

      const layout = layoutOcrDiagram(diagram);
      const audit = auditOcrLayout(layout);
      const orderViolations = auditSourceOrder(diagram.nodes, layout);

      // Surfaced so the numbers are visible on failure.
      console.log('[OCR e2e] lanes', diagram.nodes.filter((n) => n.type === 'swimlane').map((n) => `${n.label || n.department}@${Math.round(n.position.x)}`).join(' | '));
      console.log('[OCR e2e] shapes', diagram.nodes.filter((n) => n.type !== 'swimlane').length, 'edges', diagram.edges.length);
      console.log('[OCR e2e] stats', JSON.stringify(audit.stats));
      if (audit.violations.length > 0) console.log('[OCR e2e] violations', audit.violations.join('; '));
      if (orderViolations.length > 0) console.log('[OCR e2e] order', orderViolations.join('; '));

      const context = `lanes: ${laneLabels.join(' | ')} | missing: ${missing.join(', ') || '-'} | stats: ${JSON.stringify(audit.stats)}`;
      // A run that returns no connectors is a failed import even if the boxes
      // are tidy: the drawing has arrows.
      expect(diagram.edges.length, `model returned ${diagram.edges.length} edges: ${context}`).toBeGreaterThanOrEqual(minimumEdges);
      expect(coverage, context).toBeGreaterThanOrEqual(0.75);
      expect(orderViolations, context).toEqual([]);
      expect(audit.violations, context).toEqual([]);
      expect(audit.ok).toBe(true);
      expect(audit.stats.landingZoom).toBeGreaterThanOrEqual(0.7);
    },
    180_000,
  );
});
