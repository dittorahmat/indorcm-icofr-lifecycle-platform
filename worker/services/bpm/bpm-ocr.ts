/**
 * bpm-ocr — the narrow seam for BPM diagram OCR (SK-5/DKU.MBU/11/2024).
 *
 * Owns the three things an image→diagram LLM call needs: the system prompt,
 * the structured response schema (whose node-type enum derives from the single
 * runtime source `BPM_NODE_TYPES`), and the tolerant JSON parse/repair chain.
 * Nothing here touches the network or the database, so the whole seam is
 * unit-testable; the route handler is a thin adapter over it.
 */
import { SchemaType } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import { AppError } from '../../lib/utils';
import { BPM_NODE_TYPES, isBpmNodeType, type BpmNodeType } from '@shared/bpm-node-types';

/** Seam code: every repair stage failed and the model output is unparseable. */
export const BPM_OCR_UNPARSEABLE = 'BPM_OCR_UNPARSEABLE';
/** Seam code: the upstream model call failed before any parsing happened. */
export const BPM_OCR_AI_FAILED = 'BPM_OCR_AI_FAILED';

/**
 * Node types the editor owns but OCR must never emit: relation/linkage and
 * cross-sheet types carry editor semantics, not a visual shape. The difference
 * is stated once here instead of being an invisible omission from the enum.
 */
export const OCR_EXCLUDED_NODE_TYPES = [
  'system',
  'risk',
  'control',
  'docked-risk',
  'docked-control',
  'off-page-ref',
] as const satisfies readonly BpmNodeType[];

const OCR_EXCLUDED_SET: ReadonlySet<string> = new Set<string>(OCR_EXCLUDED_NODE_TYPES);

/** Enum sent to the model: the one runtime node-type source minus the exclusions. */
export const BPM_OCR_NODE_TYPE_ENUM: readonly BpmNodeType[] = BPM_NODE_TYPES.filter(
  (type) => !OCR_EXCLUDED_SET.has(type),
);

export interface OcrDiagramNode {
  id: string;
  type: BpmNodeType;
  label: string;
  position: { x: number; y: number };
  parentId?: string;
  department?: string;
  function?: string;
  width?: number;
  height?: number;
}

export interface OcrDiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface OcrDiagram {
  nodes: OcrDiagramNode[];
  edges: OcrDiagramEdge[];
}

export interface OcrPromptMessage {
  role: 'user';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  >;
}

export interface OcrPrompt {
  systemInstruction: string;
  messages: OcrPromptMessage[];
}

export const BPM_OCR_SYSTEM_INSTRUCTION = `Anda adalah sistem OCR Diagram dan Penterjemah Alur Proses Bisnis (BPMN) sesuai Regulasi SK-5/DKU.MBU/11/2024.
Tugas Anda adalah mendeteksi semua simbol alur (nodes), label teks di dalamnya, koordinat letak relatif (x dan y, dinormalisasi ke range 0 - 1000), serta panah penghubung (edges) antara nodes tersebut.

PANDUAN KLASIFIKASI BENTUK VISUAL:
- Oval / Pill Shape -> Tipe: "start" atau "end" (atau terminator alur)
- Rectangle Standar -> Tipe: "activity"
- Double-bordered Rectangle -> Tipe: "external-process"
- Blue/System Icon/Database Rectangle -> Tipe: "automated-activity"
- Diamond Shape -> Tipe: "decision"
- Wavy-bottomed Rectangle (Dokumen Tunggal) -> Tipe: "document"
- Stacked / Layered Documents (Dokumen Berlapis / Bertumpuk) -> Tipe: "multi-document". PENTING: Jika melihat simbol tumpukan beberapa lembar dokumen (misalnya Formulir + KTP + Emas, atau Memorandum + Struktur + Akad Rahn + Tanda Terima), JANGAN dipecah menjadi banyak node terpisah! Jadikan SATU node bertipe "multi-document" dengan properti "label" berisi nama-nama dokumen tersebut dipisahkan baris baru (\n).
- Inverted Triangle (Segitiga Terbalik) -> Tipe: "archive" (Simbol Arsip / FILE)
- Cylinder Shape -> Tipe: "data-media" (System/Data Media)
- Small Circle / Reference -> Tipe: "reference"
- Rounded Rectangle / Alternate Process -> Tipe: "alternate-process"
- Parallelogram -> Tipe: "data"
- Rectangle with Double Vertical Bars -> Tipe: "predefined-process"
- Rectangle with Top/Left Borders -> Tipe: "internal-storage"
- Hexagon -> Tipe: "preparation"
- Narrow-bottom Trapezoid (Trapesium Terbalik, sisi atas lebih lebar dari sisi bawah) -> Tipe: "manual-operation" (misal: Teliti Fisik Emas, Menimbang, Menjelaskan, Mengisi data)
- Rectangle with Cut Corner -> Tipe: "card"
- Wavy Top and Bottom -> Tipe: "punched-tape"
- Circle with X -> Tipe: "summing-junction"
- Circle with + -> Tipe: "or"
- Hourglass -> Tipe: "collate"
- Split Hourglass -> Tipe: "sort"
- Triangle Pointing Up -> Tipe: "extract"
- Triangle Pointing Down -> Tipe: "merge"
- Cylinder on Side -> Tipe: "stored-data"
- Bullet Pointing Right -> Tipe: "delay"
- Reel with Tail -> Tipe: "sequential-access"
- Side Cylinder with Flat Face -> Tipe: "direct-access"
- Bullet Pointing Left -> Tipe: "display"
- Flat-topped Trapezoid -> Tipe: "loop-limit"
- Dashed Three-sided Bracket -> Tipe: "annotation"
- Kolom / Lajur / Kotak pembatas vertikal atau horizontal (Lajur Fungsi) -> Tipe: "swimlane"

ATURAN NEGATIF — WAJIB ABAIKAN (JANGAN JADIKAN NODE):
- Kop surat / letterhead / logo perusahaan di bagian atas halaman.
- Blok judul dokumen (mis. "DIAGRAM ALUR", "BPM", nomor dokumen) di luar area flowchart.
- Tabel versi / revisi / tahun / halaman dan kotak metadata dokumen.
- Blok tanda tangan / persetujuan / footer (mis. "Disetujui oleh", "Mengetahui", stempel tanggal/paraf) di bagian bawah halaman.
- Ikon badge kecil RCM risiko/kontrol (< ~40px) yang menempel di sudut atau tepi shape — ini BUKAN node terpisah; abaikan sepenuhnya.
Hanya yang BOLEH menjadi node/edge: lajur swimlane, bentuk alur proses, label di dalam shape, header lajur (department/function), dan panah konektor beserta labelnya. Jika ragu, ABAIKAN — lebih baik melewatkan chrome daripada membuat node palsu.

Instruksi Partisi Kolom & Swimlane (SANGAT KRITIS):
1. Setiap kolom vertikal pembatas departemen/fungsi ADALAH SATU SWIMLANE. Identifikasi semua kolom dari kiri ke kanan secara berurutan.
   - Contoh pada 5 kolom: Kolom 1 (x: 0 - 200), Kolom 2 (x: 200 - 400), Kolom 3 (x: 400 - 600), Kolom 4 (x: 600 - 800), Kolom 5 (x: 800 - 1000).
   - Ekstrak judul header masing-masing lajur (misal Kolom 1: "NASABAH", Kolom 2: "PENAKSIR", Kolom 3: "PEMIMPIN BIDANG OPERASIONAL", Kolom 4: "UNIT OPERASIONAL", Kolom 5: "TELLER").
   - Simpan teks header tersebut ke properti "department" dan "label" dari node swimlane tersebut. Jangan biarkan kosong!
2. KEANGGOTAAN SWIMLANE (parentId):
   - SEMUA bentuk alur proses yang berada secara fisik di dalam batas horizontal sebuah kolom WAJIB memiliki "parentId" bernilai "id" dari swimlane kolom tersebut.
   - JANGAN PERNAH mengaitkan node di Kolom 1 ke Kolom 2 atau sebaliknya. Perhatikan posisi X fisik node tersebut terhadap garis kolom vertikal pembatas!
   - Kolom paling kiri (seperti "NASABAH") yang memuat dokumen awal WAJIB berisi node-node tersebut dengan parentId menunjuk ke swimlane kolom paling kiri.
3. KONSOLIDASI STACKED DOCUMENTS:
   - Jika ada simbol dokumen bertumpuk 2-4 lembar, ekstrak menjadi TEPAT SATU node bertipe "multi-document".
   - Gabungkan teks dokumen tersebut menjadi satu label yang rapi. Contoh: "Formulir Pembiayaan Rahn\nKTP\nEmas".

Instruksi Edge, Percabangan & Label:
- Setiap panah penghubung WAJIB menjadi satu edge dengan source = id node asal, target = id node tujuan.
- PENTING: Untuk panah antar-kolom (cross-swimlane flow dari kiri ke kanan), pastikan alur logisnya jelas: sourceHandle = "right", targetHandle = "left".
- Jika panah keluar dari simbol Decision (Diamond) memuat teks persetujuan seperti "SETUJU" / "YA" / "TIDAK" / "NO":
  * Masukkan teks tersebut ke properti "label" pada EDGE panah bersangkutan. JANGAN jadikan teks "SETUJU" atau "TIDAK" sebagai node mandiri!
  * Jika keputusan memiliki cabang negatif ("TIDAK") ke samping, tentukan sourceHandle = "left" atau "right" sesuai gambar.
  * Jika keputusan memiliki cabang positif ("SETUJU" / "YA") ke bawah, tentukan sourceHandle = "bottom" dan targetHandle = "top".
- KONSOLIDASI BUNDLE DOKUMEN: Simbol berkas formulir bertumpuk (seperti Formulir + KTP + Emas) WAJIB berupa 1 node "multi-document". Jangan memecah dokumen yang digambar tumpuk menjadi entitas terpisah.
- Jika ada panah yang menunjuk ke terminator akhir (misal kapsul "NASABAH"), jadikan node terminator tersebut bertipe "end" atau "reference" dengan target edge mengarah ke sana.

Format keluaran WAJIB berupa JSON objek yang memenuhi skema data yang diminta.`;

export const BPM_OCR_USER_TEXT =
  'Mohon analisa gambar diagram alur proses bisnis ini. Identifikasi semua node, label, koordinat (x,y) relatif antara 0-1000, serta semua edge penghubung secara akurat.';

/** Prompt + multimodal message for the image, so the route stays a pure adapter. */
export function buildOcrPrompt(input: { image: string }): OcrPrompt {
  return {
    systemInstruction: BPM_OCR_SYSTEM_INSTRUCTION,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: BPM_OCR_USER_TEXT },
          { type: 'image_url', image_url: { url: input.image } },
        ],
      },
    ],
  };
}

export const BPM_OCR_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    nodes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING, enum: [...BPM_OCR_NODE_TYPE_ENUM] },
          label: { type: SchemaType.STRING },
          position: {
            type: SchemaType.OBJECT,
            properties: {
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER },
            },
            required: ['x', 'y'],
          },
          parentId: { type: SchemaType.STRING },
          department: { type: SchemaType.STRING },
          function: { type: SchemaType.STRING },
          width: { type: SchemaType.NUMBER },
          height: { type: SchemaType.NUMBER },
        },
        required: ['id', 'type', 'label', 'position'],
      },
    },
    edges: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          source: { type: SchemaType.STRING },
          target: { type: SchemaType.STRING },
          label: { type: SchemaType.STRING },
        },
        required: ['id', 'source', 'target'],
      },
    },
  },
  required: ['nodes', 'edges'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const toStringValue = (value: unknown): string => (typeof value === 'string' ? value : '');
const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;
const toNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;
const toOptionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/** Unknown node types are coerced to the neutral `activity` shape (locked by tests). */
const coerceNodeType = (value: unknown): BpmNodeType => (isBpmNodeType(value) ? value : 'activity');

function toNode(raw: Record<string, unknown>): OcrDiagramNode {
  const position = isRecord(raw.position) ? raw.position : {};
  const node: OcrDiagramNode = {
    id: toStringValue(raw.id),
    type: coerceNodeType(raw.type),
    label: toStringValue(raw.label),
    position: { x: toNumber(position.x), y: toNumber(position.y) },
  };
  const parentId = toOptionalString(raw.parentId);
  if (parentId !== undefined) node.parentId = parentId;
  const department = toOptionalString(raw.department);
  if (department !== undefined) node.department = department;
  const fn = toOptionalString(raw.function);
  if (fn !== undefined) node.function = fn;
  const width = toOptionalNumber(raw.width);
  if (width !== undefined) node.width = width;
  const height = toOptionalNumber(raw.height);
  if (height !== undefined) node.height = height;
  return node;
}

function toEdge(raw: Record<string, unknown>): OcrDiagramEdge {
  const edge: OcrDiagramEdge = {
    id: toStringValue(raw.id),
    source: toStringValue(raw.source),
    target: toStringValue(raw.target),
  };
  const label = toOptionalString(raw.label);
  if (label !== undefined) edge.label = label;
  const sourceHandle = toOptionalString(raw.sourceHandle);
  if (sourceHandle !== undefined) edge.sourceHandle = sourceHandle;
  const targetHandle = toOptionalString(raw.targetHandle);
  if (targetHandle !== undefined) edge.targetHandle = targetHandle;
  return edge;
}

function toDiagram(value: unknown): OcrDiagram {
  if (!isRecord(value)) return { nodes: [], edges: [] };
  const nodes = Array.isArray(value.nodes) ? value.nodes.filter(isRecord).map(toNode) : [];
  const edges = Array.isArray(value.edges) ? value.edges.filter(isRecord).map(toEdge) : [];
  return { nodes, edges };
}

/** Strip a single ```/```json fence when the model ignored responseMimeType. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

/** Last-resort slice: drop prose around the JSON document (model chatter). */
function extractJsonSubstring(text: string): string | undefined {
  const start = text.search(/[{[]/);
  if (start === -1) return undefined;
  const close = text[start] === '{' ? '}' : ']';
  const end = text.lastIndexOf(close);
  return end > start ? text.slice(start, end + 1) : undefined;
}

/** Dangling tail from a truncated stream (`, "position` / `, "foo": `). */
function trimDanglingTail(text: string): string {
  return text
    .replace(/,\s*"[^"]*"?\s*:\s*[^,}\]]*$/, '')
    .replace(/,\s*"[^"]*"$/, '');
}

/**
 * Tolerant parse chain: raw → jsonrepair → tail-truncate → prose extraction.
 * Every stage keeps the original fallbacks; prose extraction is the addition
 * that lets a chatty model response (`Berikut hasilnya: {...}`) still parse.
 */
function parseWithRepair(text: string): unknown {
  const trimmed = text.trim();
  const candidates = [trimmed, trimDanglingTail(trimmed), extractJsonSubstring(trimmed)];
  let lastError: unknown;
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch (err) {
      lastError = err;
    }
    try {
      return JSON.parse(jsonrepair(candidate));
    } catch (err) {
      lastError = err;
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  console.error('[BPM OCR] JSON repair failed. Raw content preview:', trimmed.slice(0, 300));
  throw new AppError(BPM_OCR_UNPARSEABLE, `Invalid JSON format: ${detail}`, 502);
}

/** Tolerant parse of the model's raw text into a normalized diagram. */
export function parseOcrResponse(raw: string): OcrDiagram {
  return toDiagram(parseWithRepair(stripCodeFence(raw)));
}
