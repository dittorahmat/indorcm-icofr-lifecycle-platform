import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad } from '../../lib/utils';
import { getDb } from '../../db';
import { csaSchedules } from '../../db/schema';
import { AIService } from '../../services/ai-service';
import type { RetrievalRow } from '../../services/ai-service';
import { AuditService } from '../../services/audit-service';
import { getAiCacheVersions, createDocMarkerLoader, createApprovedSimulationLoader } from '../../services/ai/ai-cache-versions';
import { checkDailyRateLimit, isCacheUnversioned, sharedAiRateLimitStore } from '@shared/ai-cache';

import { ICOFR_TOOLS } from '../../services/ai/tool-definitions';
import { AIToolExecutor, ToolContext } from '../../services/ai/tool-executor';

const aiChatApp = new Hono<HonoEnv>();

// --- AI Chatbot Routes ---

aiChatApp.post('/ai/chat', async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return bad(c, 'GEMINI_API_KEY not configured.');
  }

  let body: {
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    actionConfirmation?: { action: string; data: typeof csaSchedules.$inferInsert };
    context?: { path?: string; timestamp?: string };
  };
  try {
    body = await c.req.json();
  } catch {
    return bad(c, 'Invalid request body');
  }

  const { message, conversationHistory = [] } = body;

  const clientId = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || 'unknown';

  // Contract: cache hits count toward the daily limit — checked before cache lookup.
  const checked = checkDailyRateLimit(sharedAiRateLimitStore, `chat:${clientId}`, Date.now());
  if (!checked.allowed) {
    return bad(c, 'Rate limit exceeded.', 429);
  }

  // Handle direct action confirmation (Agentic Action)
  if (body.actionConfirmation) {
    const { action, data } = body.actionConfirmation;
    const db = getDb(c.env.DATABASE_URL);
    if (action === 'CREATE_SCHEDULE') {
      const rawPlannedDate = (data as { plannedDate?: unknown }).plannedDate;
      await db.insert(csaSchedules).values(
        typeof rawPlannedDate === 'string' ? { ...data, plannedDate: new Date(rawPlannedDate) } : data,
      );
      return ok(c, { success: true, response: "Jadwal berhasil dibuat." });
    }
  }

  const context = body.context;
  const pageContext = context?.path ? `\nPengguna saat ini sedang melihat halaman: ${context.path}` : '';

  const role = c.get('userRole');
  const userDeptId = c.get('departmentId');
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');

  let retrievalResults: RetrievalRow[] = [];
  const versions = await getAiCacheVersions({
    loadDocMarker: createDocMarkerLoader(db),
    loadApprovedSimulationId: createApprovedSimulationLoader(db),
  }, orgId);
  const aiService = new AIService({
    provider: c.env.AI_PROVIDER === 'openai-compatible' ? 'openai-compatible' : 'gemini',
    apiKey: apiKey,
    baseUrl: c.env.AI_BASE_URL,
    embeddingModel: c.env.AI_EMBEDDING_MODEL,
    chatModel: c.env.AI_CHAT_MODEL,
    cacheScope: { orgId, kbVersion: versions.kbVersion, simulationId: versions.simulationId },
    ttlEnv: {
      AI_CACHE_TTL_EMBEDDING_MS: c.env.AI_CACHE_TTL_EMBEDDING_MS,
      AI_CACHE_TTL_RETRIEVAL_MS: c.env.AI_CACHE_TTL_RETRIEVAL_MS,
      AI_CACHE_TTL_CHAT_MS: c.env.AI_CACHE_TTL_CHAT_MS,
    },
  });

  try {
    const queryVector = await aiService.generateEmbedding(message);
    retrievalResults = (await aiService.hybridSearch(db, orgId, message, queryVector, 10)) || [];
  } catch (e: unknown) {
    console.error('Retrieval failed, falling back to basic prompt:', e instanceof Error ? e.message : String(e));
    retrievalResults = [];
  }
  const sourcesCached = aiService.lastRetrievalCacheHit;
  const unversioned = isCacheUnversioned(versions);

  const knowledgeBase = (retrievalResults && retrievalResults.length > 0)
    ? retrievalResults.map(r => AIService.situationalChunking(r.content, { title: r.title, category: r.category })).join('\n\n')
    : "KOSONG: Tidak ada dokumen referensi/prosedur/regulasi yang relevan yang ditemukan untuk pertanyaan ini. Pengguna belum mengunggah dokumen yang sesuai atau sistem pencarian tidak menemukan hasil.";

  const sources = (retrievalResults || []).map(r => ({ title: r.title, score: r.score }));

  try {
    const systemInstruction = `Anda adalah Asisten AI & Analis Strategis IndoGRC Pro. Tugas Anda adalah membantu pengguna memahami regulasi (SK-5), cara penggunaan aplikasi, serta melakukan analisis data ICOFR lintas modul.

Waktu saat ini: ${context?.timestamp || new Date().toISOString()}
User: ${c.get('userId')} (Role: ${role}, Dept: ${userDeptId})
Halaman saat ini: ${context?.path || 'Dashboard'}

Anda memiliki akses ke data live aplikasi melalui fungsi-fungsi yang disediakan.

STRATEGI ANALISIS:
1. Top-Down Analysis: Jika ditanya tentang risiko, hubungkan akun signifikan (Scoping) dengan status pengujian (Testing).
2. Quantitative Severity: Gunakan tool 'calculate_deficiency_magnitude' untuk menilai temuan secara objektif berdasarkan PM.
3. Narrative Assistance: Bantu user menyusun narasi audit yang profesional untuk temuan Ineffective atau justifikasi sampling.
4. Agentic Action: Anda dapat menjadwalkan CSA atau pengetesan. Tindakan ini memerlukan konfirmasi manual dari pengguna.

Jika memanggil fungsi, gunakan data yang dikembalikan untuk merangkai jawaban. Sertakan link jika data menyertakan ID (format link: /modul/detail/ID).

PENTING:
- Anda HANYA boleh menjawab pertanyaan berdasarkan data yang ada pada KNOWLEDGE BASE di atas, data live aplikasi melalui tool yang dipanggil, serta topik seputar platform IndoGRC Pro dan regulasi ICOFR (SK-5).
- Jika bagian KNOWLEDGE BASE di atas berisi "KOSONG: ...", ini berarti tidak ada dokumen referensi yang diunggah atau cocok. Anda harus memberi tahu pengguna secara sopan bahwa tidak ada dokumen referensi terkait topik tersebut yang diunggah ke sistem, dan Anda dilarang memberikan jawaban dari pengetahuan umum Anda untuk topik eksternal tersebut.
- Jika pengguna menanyakan hal di luar cakupan aplikasi IndoGRC Pro, regulasi ICOFR (SK-5), atau di luar KNOWLEDGE BASE (seperti perihal cuti karyawan secara umum, resep masakan, pemrograman umum, dll), Anda WAJIB menolak menjawab secara sopan dan menjelaskan batas kemampuan Anda.
- Jika role user adalah 'Line 1', Anda dilarang memberikan angka detil Materialitas (OM/PM). Katakan bahwa data tersebut bersifat konfidensial untuk Lini 1.
- Setiap narasi yang Anda buat harus ditandai sebagai 'DRAFT' dan disarankan untuk direviu ulang oleh user.

Bahasa: Bahasa Indonesia

--- KNOWLEDGE BASE ---
${knowledgeBase}
--- END KNOWLEDGE BASE ---`;

    const recentHistory = conversationHistory.slice(-10);
    const messages = [
      ...recentHistory,
      { role: 'user', content: message }
    ];

    let result = await aiService.generateChatResponse({
      systemInstruction,
      messages,
      tools: ICOFR_TOOLS,
    });

    let responseText = result.content;
    let pendingAction = null;

    // Multi-turn tool execution loop (Max 3 turns for safety)
    let turns = 0;
    while (result.toolCalls?.length && turns < 3) {
      const toolCalls = result.toolCalls;
      const toolContext: ToolContext = {
        db,
        orgId,
        userId: c.get('userId'),
        role,
        departmentId: userDeptId
      };

      const functionResponses = [];
      for (const call of toolCalls) {
        try {
          const toolMethod = AIToolExecutor[call.name as keyof typeof AIToolExecutor];
          if (toolMethod) {
            const toolOutput = await toolMethod(toolContext, call.args);
            if (toolOutput && typeof toolOutput === 'object' && 'requiresConfirmation' in toolOutput && toolOutput.requiresConfirmation) {
              pendingAction = toolOutput;
            }
            functionResponses.push({ role: 'function', name: call.name, content: JSON.stringify(toolOutput) });
          }
        } catch (err: unknown) {
          functionResponses.push({ role: 'function', name: call.name, content: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) });
        }
      }

      // Add tool results to message history
      messages.push({ role: 'assistant', content: responseText });
      messages.push(...functionResponses.map(f => ({ role: 'system', content: f.content }))); // Map to system/assistant role depending on provider

      result = await aiService.generateChatResponse({
        systemInstruction,
        messages,
        tools: ICOFR_TOOLS,
      });
      responseText = result.content;
      turns++;
    }

    try {
      const audit = new AuditService(db);
      await audit.logAction({
        organizationId: orgId,
        userId: c.get('userId') ?? 'unknown',
        action: sourcesCached ? 'AI_CHAT_CACHE_HIT' : 'AI_CHAT_GENERATE',
        entityType: 'AiChat',
        entityId: 'ai-chat',
        dataAfter: {
          cacheHit: sourcesCached,
          sourcesCached,
          embeddingCacheHit: aiService.lastEmbeddingCacheHit,
          kbVersion: versions.kbVersion,
          simulationId: versions.simulationId,
          sourcesCount: sources.length,
          unversioned,
          cacheSkipped: 'tool-path',
        },
      });
    } catch {
      // Audit must never fail the chat response.
    }

    return ok(c, {
      response: responseText,
      sources: sources,
      sourcesCached,
      // Chat contract: cacheHit mirrors the retrieval-prefix hit. Full tool-path
      // responses are never cached (live data); prefix savings arrive via
      // embedding + retrieval caches.
      cacheHit: sourcesCached,
      pendingAction: pendingAction
    });

  } catch (error: unknown) {
    console.error('[AI Chat Route Error]:', error);
    return bad(c, `AI service error: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
});

export default aiChatApp;
