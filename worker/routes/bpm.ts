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
- Oval / Pill Shape -> Tipe: "start" atau "end"
- Rectangle Standar -> Tipe: "activity"
- Double-bordered Rectangle -> Tipe: "external-process"
- Blue/System Icon/Database Rectangle -> Tipe: "automated-activity"
- Diamond Shape -> Tipe: "decision"
- Wavy-bottomed Rectangle -> Tipe: "document"
- Inverted Triangle -> Tipe: "archive" (Arsip)
- Cylinder Shape -> Tipe: "data-media" (System/Data Media)
- Small Circle / Reference -> Tipe: "reference"
- Rounded Rectangle / Alternate Process -> Tipe: "alternate-process"
- Parallelogram -> Tipe: "data"
- Rectangle with Double Vertical Bars -> Tipe: "predefined-process"
- Rectangle with Top/Left Borders -> Tipe: "internal-storage"
- Stacked Document -> Tipe: "multi-document"
- Hexagon -> Tipe: "preparation"
- Narrow-bottom Trapezoid -> Tipe: "manual-operation"
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

Instruksi Koordinat & Swimlane:
- Koordinat x dan y harus berada dalam rentang 0 s.d. 1000.
- Koordinat x adalah sumbu horizontal (kiri ke kanan).
- Koordinat y adalah sumbu vertikal (atas ke bawah).
- PENTING — KOORDINAT HANYA HINT URUTAN RELATIF: nilai x/y yang Anda kembalikan TIDAK dipakai sebagai posisi piksel final. Layout final dihitung otomatis di frontend (lane diurutkan kiri-ke-kanan dari median x, node di dalam lane diurutkan atas-ke-bawah dari kedalaman alur/BFS, tie-break dari y). Fokus Anda adalah keanggotaan lane yang benar (parentId), topologi edge yang benar, label yang akurat, dan urutan relatif kasar — BUKAN presisi piksel. Tetap berikan x/y berbeda untuk setiap node agar urutan dapat disimpulkan, jangan menumpuk semua di koordinat sama.
- Jika mendeteksi swimlane (kolom pembatas):
  1. Buat node tipe "swimlane".
  2. Ekstrak nama Departemen dan Fungsi yang tertulis di bagian header/judul swimlane tersebut, simpan ke properti "department", "function", serta "label". Properti "label" WAJIB diisi sama dengan teks judul/header swimlane tersebut (misal "DEBITUR", "MARKETING", "KREDIT ADMIN", "PEJABAT BERWENANG"), jangan biarkan "label" kosong.
  3. Aturan ekstraksi teks header: ambil teks header lajur apa adanya; jika tertulis "DEPARTMENT DEBITUR" maka department = "DEBITUR" dan label = "DEBITUR"; jika tertulis "MARKETING", "KREDIT ADMIN", "PEJABAT BERWENANG" maka department = teks tersebut, label = teks tersebut, dan function = string kosong bila tidak ada fungsi terpisah; jika header memuat dua baris (departemen di baris 1, fungsi di baris 2) maka baris 1 -> department & label, baris 2 -> function. Jangan mengarang department/function yang tidak tertulis.
  4. Tentukan ukuran "width" (lebar lajur, misal 350-450) dan "height" (tinggi lajur, misal 1000) yang sesuai.
  5. Untuk setiap bentuk alur proses yang secara fisik berada di dalam area kolom swimlane tersebut, isi properti "parentId" dengan "id" dari swimlane bersangkutan.

Instruksi Edge & Label:
- Setiap panah penghubung WAJIB menjadi satu edge dengan source = id node asal, target = id node tujuan.
- Jika panah pada gambar memiliki teks label (mis. "YA"/"YES", "TIDAK"/"NO" pada cabang decision, atau label lain di tengah panah), Anda WAJIB mengisi properti edge "label" dengan teks tersebut persis seperti tertulis. Jangan kosongkan label bila gambar menampilkannya.
- Jika panah tidak memiliki label, biarkan properti edge "label" kosong.

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

    let parsedResult;
    try {
      parsedResult = JSON.parse(result.content);
    } catch (e) {
      const cleanJson = result.content.replace(/```json|```/g, "").trim();
      parsedResult = JSON.parse(cleanJson);
    }

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
