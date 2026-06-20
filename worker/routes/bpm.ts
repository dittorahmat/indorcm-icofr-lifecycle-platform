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

Instruksi Koordinat:
- Koordinat x dan y harus berada dalam rentang 0 s.d. 1000.
- Koordinat x adalah sumbu horizontal (kiri ke kanan).
- Koordinat y adalah sumbu vertikal (atas ke bawah).
- Atur agar nodes tersusun rapi secara visual dan tidak menumpuk pada koordinat yang sama.

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
              enum: ["start", "end", "activity", "manual-input", "external-process", "automated-activity", "decision", "document", "archive", "data-media", "reference"]
            },
            label: { type: SchemaType.STRING },
            position: {
              type: SchemaType.OBJECT,
              properties: {
                x: { type: SchemaType.NUMBER },
                y: { type: SchemaType.NUMBER }
              },
              required: ["x", "y"]
            }
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

bpm.post('/bpm-processes', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const bpmService = new BpmService(db);
  const body = await c.req.json();
  const newItem = await bpmService.createProcess(c.get('organizationId')!, c.get('userId')!, body);
  return ok(c, newItem);
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
