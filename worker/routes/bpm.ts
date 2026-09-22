import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { BpmService } from "../services/bpm-service";
import { rbac } from "../lib/guard";
import { AIService } from "../services/ai-service";
import { SchemaType } from "@google/generative-ai";

const bpm = new Hono<HonoEnv>();

// --- BPM Diagram Routes ---

bpm.get('/bpm-diagrams', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const orgId = c.get('organizationId')!;
  const year = c.req.query('year');

  const items = await bpmService.getAllDiagrams(orgId, year ? parseInt(year) : undefined);
  return ok(c, { items });
});

bpm.all('/bpm-diagrams/cleanup-flow-prefix', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const orgId = c.get('organizationId') || 'org_default';
  const result = await bpmService.cleanupFlowPrefixes(orgId);
  return ok(c, result);
});

bpm.get('/bpm-diagrams/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;
  const noGL = c.req.query('noGL');
  
  const diagram = await bpmService.getDiagramById(orgId, id!, noGL);
  if (!diagram) return notFound(c);
  
  return ok(c, diagram);
});

bpm.post('/bpm-diagrams', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json<any>();
  const newItem = await bpmService.createDiagram(c.get('organizationId')!, c.get('userId')!, body);
  return ok(c, newItem);
});

bpm.put('/bpm-diagrams/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const body = await c.req.json<any>();

  const result = await bpmService.updateDiagram(c.get('organizationId')!, c.get('userId')!, id!, body);
  return ok(c, result);
});

bpm.delete('/bpm-diagrams/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const result = await bpmService.deleteDiagram(c.get('organizationId')!, id!);
  return ok(c, result);
});

bpm.get('/bpm-diagrams/by-control/:controlId', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const controlId = c.req.param('controlId');
  const orgId = c.get('organizationId')!;

  const result = await bpmService.getDiagramByControlId(orgId, controlId);
  if (!result) return notFound(c, 'Diagram not found for this control');
  
  return ok(c, result);
});

bpm.get('/bpm-diagrams/by-gl/:noGL', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const noGL = c.req.param('noGL');
  const subProcessName = c.req.query('subProcess');
  const orgId = c.get('organizationId')!;

  const diagram = await bpmService.getDiagramByGL(orgId, noGL, subProcessName);
  if (!diagram) return notFound(c, 'Diagram not found');

  return ok(c, diagram);
});

bpm.post('/bpm-diagrams/ocr', rbac(['Line 1', 'Admin']), async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return bad(c, 'AI API Key is not configured.');
  }

  const body = await c.req.json<{ image: string }>();
  if (!body.image) {
    return bad(c, 'Image data is required');
  }

  const aiService = new AIService({
    provider: (c.env.AI_PROVIDER as any) || "gemini",
    apiKey: apiKey,
    baseUrl: c.env.AI_BASE_URL,
    embeddingModel: c.env.AI_EMBEDDING_MODEL,
    chatModel: c.env.AI_CHAT_MODEL,
  });

  const systemInstruction = `Anda adalah sistem OCR Diagram dan Penterjemah Alur Proses Bisnis (BPMN) sesuai Regulasi SK-5/DKU.MBU/11/2024.
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
- Jika panah keluar dari simbol Decision (Diamond) memuat teks persetujuan seperti "SETUJU" / "YA" / "TIDAK" / "NO", masukkan teks tersebut ke properti "label" pada EDGE panah bersangkutan. JANGAN jadikan teks "SETUJU" atau "TIDAK" sebagai node mandiri!
- Jika ada panah yang menunjuk ke terminator akhir (misal kapsul "NASABAH"), jadikan node terminator tersebut bertipe "end" atau "reference" dengan target edge mengarah ke sana.

Format keluaran WAJIB berupa JSON objek yang memenuhi skema data yang diminta.`;

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Mohon analisa gambar diagram alur proses bisnis ini. Identifikasi semua node, label, koordinat (x,y) relatif antara 0-1000, serta semua edge penghubung secara akurat."
        },
        {
          type: "image_url",
          image_url: {
            url: body.image
          }
        }
      ]
    }
  ];

  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      nodes: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            type: {
              type: SchemaType.STRING,
              enum: [
                "start", "end", "activity", "manual-input", "external-process", 
                "automated-activity", "decision", "document", "archive", "data-media", 
                "reference", "alternate-process", "data", "predefined-process", 
                "internal-storage", "multi-document", "preparation", "manual-operation", 
                "card", "punched-tape", "summing-junction", "or", "collate", "sort", 
                "extract", "merge", "stored-data", "delay", "sequential-access", 
                "direct-access", "display", "loop-limit", "annotation", "swimlane"
              ]
            },
            label: { type: SchemaType.STRING },
            position: {
              type: SchemaType.OBJECT,
              properties: {
                x: { type: SchemaType.NUMBER },
                y: { type: SchemaType.NUMBER }
              },
              required: ["x", "y"]
            },
            parentId: { type: SchemaType.STRING },
            department: { type: SchemaType.STRING },
            function: { type: SchemaType.STRING },
            width: { type: SchemaType.NUMBER },
            height: { type: SchemaType.NUMBER }
          },
          required: ["id", "type", "label", "position"]
        }
      },
      edges: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            source: { type: SchemaType.STRING },
            target: { type: SchemaType.STRING },
            label: { type: SchemaType.STRING }
          },
          required: ["id", "source", "target"]
        }
      }
    },
    required: ["nodes", "edges"]
  };

  try {
    const result = await aiService.generateChatResponse({
      systemInstruction,
      messages,
      responseSchema
    });

    let rawContent = (result.content || "").trim();
    if (rawContent.startsWith("```")) {
      rawContent = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(rawContent);
    } catch {
      // Robust fallback repair for unterminated JSON / truncated streaming strings
      try {
        let repaired = rawContent;
        // If truncated inside an unclosed string, close the quote
        const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          repaired += '"';
        }
        // Balance curly braces and square brackets
        const openBraces = (repaired.match(/{/g) || []).length;
        const closeBraces = (repaired.match(/}/g) || []).length;
        const openBrackets = (repaired.match(/\[/g) || []).length;
        const closeBrackets = (repaired.match(/\]/g) || []).length;

        for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

        parsedResult = JSON.parse(repaired);
      } catch (innerErr: any) {
        console.error("[BPM OCR API] JSON Repair failed. Raw content preview:", rawContent.slice(0, 300));
        throw new Error(`Invalid JSON format: ${innerErr.message}`);
      }
    }

    if (!parsedResult || typeof parsedResult !== 'object') {
      parsedResult = { nodes: [], edges: [] };
    }
    if (!Array.isArray(parsedResult.nodes)) parsedResult.nodes = [];
    if (!Array.isArray(parsedResult.edges)) parsedResult.edges = [];

    return ok(c, parsedResult);
  } catch (err: any) {
    console.error("[BPM OCR API] Error:", err.message);
    return bad(c, `AI parsing failed: ${err.message}`, 500);
  }
});

// --- BPM Process Routes ---

bpm.get('/bpm-processes', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const orgId = c.get('organizationId')!;
  const yearStr = c.req.query('year');
  const idStr = c.req.query('id');
  
  if (!yearStr && !idStr) {
    return c.json({ success: false, error: 'Year parameter is required' }, 400);
  }

  const items = await bpmService.getAllProcesses(
    orgId, 
    c.req.query('noGL'), 
    idStr,
    yearStr ? parseInt(yearStr) : undefined
  );
  return ok(c, { items });
});

bpm.get('/bpm-processes/:id/controls', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;

  const items = await bpmService.getControlsByProcess(orgId, id!);
  return ok(c, { items });
});

bpm.get('/bpm-processes/:id/next-sequences', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;

  try {
    const result = await bpmService.getNextSequences(orgId, id!);
    return ok(c, result);
  } catch (e: any) {
    return bad(c, e.message);
  }
});

bpm.post('/bpm-processes', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json();
  const newItem = await bpmService.createProcess(c.get('organizationId')!, c.get('userId')!, body);
  return ok(c, newItem);
});

bpm.post('/bpm-processes/batch-reorganize', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json();

  try {
    const result = await bpmService.batchReorganizeProcesses(
      c.get('organizationId')!,
      c.get('userId')!,
      body
    );
    return ok(c, result);
  } catch (e: any) {
    return bad(c, e.message);
  }
});

bpm.patch('/bpm-processes/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    const result = await bpmService.updateProcess(c.get('organizationId')!, id!, body);
    return ok(c, result);
  } catch (e: any) {
    return bad(c, e.message);
  }
});

bpm.post('/bpm-processes/:id/workflow', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    const result = await bpmService.handleWorkflowAction(
      c.get('organizationId')!,
      c.get('userId')!,
      c.get('userRole')!,
      id!,
      body
    );
    return ok(c, result);
  } catch (e: any) {
    return bad(c, e.message);
  }
});

bpm.delete('/bpm-processes/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const id = c.req.param('id');
  const result = await bpmService.deleteProcess(c.get('organizationId')!, id!);
  return ok(c, result);
});

bpm.get('/legacy/bpm-summary', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId')!;
  const bpmService = new BpmService(db);
  const items = await bpmService.getAllDiagrams(orgId);
  return ok(c, { items });
});

export default bpm;
