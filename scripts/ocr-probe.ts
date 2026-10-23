// scripts/ocr-probe.ts - call the OCR model once for a drawing, capture the response.
// Usage:
//   npm run ocr:probe -- fixtures/BPM_Persetujuaan_Kredit_KUR_20260831.pdf
//   npm run ocr:probe -- fixtures/scan.png --out fixtures/ocr/my-drawing.ocr.json
//
// Why this exists: the live path costs a model call (10-240 s), and the provider
// is not always available (503 high-demand). Before this script the only way to
// refresh a captured response was to edit/run the opt-in vitest probe, so
// verifying a layout change meant paying for the model AND waiting on it.
// Now verification is offline: this script captures once, and
// `src/test/ocr-real-snapshot.test.ts` replays the capture in `npm test`.
//
// The probe runs the same seam as production (`POST /api/bpm-diagrams/ocr`):
// pdfjs page render -> buildOcrPrompt -> AIService (temperature from the prompt)
// -> parseOcrResponse, then lays the result out and prints the audit verdict so
// a bad capture is visible immediately.
//
// Env: GEMINI_API_KEY (or the configured provider) from `.env` / `.dev.vars` /
// process env. No key -> the script exits before touching the network.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

import { AIService } from '../worker/services/ai-service';
import {
  BPM_OCR_RESPONSE_SCHEMA,
  buildOcrPrompt,
  parseOcrResponse,
} from '../worker/services/bpm/bpm-ocr';
import { layoutOcrDiagram } from '../src/utils/ocr-layout';
import { auditOcrLayout, auditSourceOrder, auditUpwardDrift } from '../src/utils/ocr-layout-audit';

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

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const sourceArg = process.argv[2];
if (!sourceArg || sourceArg.startsWith('--')) {
  console.error('Usage: npm run ocr:probe -- <drawing.pdf|.png|.jpg> [--out <capture.json>] [--page <n>]');
  process.exit(1);
}

const sourcePath = resolve(process.cwd(), sourceArg);
if (!existsSync(sourcePath)) {
  console.error(`Source not found: ${sourcePath}`);
  process.exit(1);
}

const apiKey = env.GEMINI_API_KEY ?? '';
if (apiKey === '') {
  console.error('GEMINI_API_KEY is missing (.env / .dev.vars / process env). No model call made.');
  process.exit(1);
}

const pageNumber = Number(argValue('--page') ?? '1');
const slug = basename(sourcePath).replace(/\.[^.]+$/, '');
const outPath = resolve(process.cwd(), argValue('--out') ?? `fixtures/ocr/${slug}.ocr.json`);

/** One PDF page as PNG bytes, through pdfjs's Node canvas path. */
async function pdfPageToPng(path: string, page: number): Promise<Uint8Array> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)), isEvalSupported: false }).promise;
  try {
    const pdfPage = await doc.getPage(page);
    const viewport = pdfPage.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const canvasContext = canvas.getContext('2d');
    // @ts-expect-error boundary: pdfjs types the target as the DOM 2D context,
    // while @napi-rs/canvas supplies the same surface to its own NodeCanvasFactory.
    await pdfPage.render({ canvasContext, viewport }).promise;
    return new Uint8Array(canvas.toBuffer('image/png'));
  } finally {
    await doc.destroy();
  }
}

/** PDF page (pdfjs) or a PNG/JPG export of the same page. */
async function sourceToImageDataUrl(path: string, page: number): Promise<string> {
  if (/\.pdf$/i.test(path)) {
    const png = await pdfPageToPng(path, page);
    return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
  }
  const mime = /\.jpe?g$/i.test(path) ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${readFileSync(path).toString('base64')}`;
}

async function main(): Promise<void> {
  console.log(`[ocr-probe] ${sourcePath} (page ${pageNumber})`);
  const { systemInstruction, messages, temperature } = buildOcrPrompt({
    image: await sourceToImageDataUrl(sourcePath, pageNumber),
  });

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
  if (diagram.nodes.length === 0) {
    console.error('[ocr-probe] model returned no nodes; nothing captured.');
    process.exit(1);
  }

  writeFileSync(outPath, `${JSON.stringify(diagram, null, 2)}\n`);
  const lanes = diagram.nodes.filter((node) => node.type === 'swimlane');
  const shapes = diagram.nodes.length - lanes.length;
  console.log(`[ocr-probe] captured ${shapes} shapes, ${lanes.length} lanes, ${diagram.edges.length} edges -> ${outPath}`);

  const layout = layoutOcrDiagram(diagram);
  const audit = auditOcrLayout(layout);
  const orderViolations = auditSourceOrder(diagram.nodes, layout);
  const upwardDrift = auditUpwardDrift(diagram.nodes, layout);
  console.log(`[ocr-probe] audit stats ${JSON.stringify(audit.stats)}`);
  if (audit.violations.length > 0) console.log('[ocr-probe] geometry violations:', audit.violations.join('; '));
  if (orderViolations.length > 0) console.log('[ocr-probe] source-order violations:', orderViolations.join('; '));
  if (upwardDrift.length > 0) console.log('[ocr-probe] upward drift:', upwardDrift.join('; '));

  const ok = audit.ok && orderViolations.length === 0 && upwardDrift.length === 0;
  console.log(`[ocr-probe] ${ok ? 'PASS' : 'FAIL'} - capture is ${ok ? '' : 'NOT '}ready to lock in ocr-real-snapshot.test.ts`);
  // A capture is a fixture: point the reader at the file that replays it.
  console.log(`[ocr-probe] add/refresh the case in src/test/ocr-real-snapshot.test.ts with ${basename(outPath)}`);
  process.exit(ok ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error('[ocr-probe] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
