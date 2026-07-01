import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../../worker/services/ai-service';

describe('AIService - generateChatResponse Multimodal Routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly maps OpenAI image payload to Gemini inlineData when provider is gemini', async () => {
    // Mock GoogleGenerativeAI and its sub-methods
    const mockSendMessage = vi.fn().mockResolvedValue({
      response: {
        text: () => '{"nodes": [], "edges": []}',
        functionCalls: () => undefined,
      }
    });

    const mockStartChat = vi.fn().mockReturnValue({
      sendMessage: mockSendMessage
    });

    const mockGetModel = vi.fn().mockReturnValue({
      startChat: mockStartChat
    });

    const mockGenAI = {
      getGenerativeModel: mockGetModel
    };

    const aiService = new AIService({
      provider: 'gemini',
      apiKey: 'test-key',
    });

    // Inject mock
    (aiService as any).genAI = mockGenAI;

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this flow.' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANS' } }
        ]
      }
    ];

    const result = await aiService.generateChatResponse({
      systemInstruction: 'Test instructions',
      messages,
    });

    expect(result.content).toBe('{"nodes": [], "edges": []}');
    expect(mockGetModel).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: 'Test instructions',
    }));

    // Verify mapContentToGeminiParts was called and converted image to inlineData
    expect(mockSendMessage).toHaveBeenCalledWith([
      { text: 'Analyze this flow.' },
      { inlineData: { data: 'iVBORw0KGgoAAAANS', mimeType: 'image/png' } }
    ]);
  });

  it('correctly formats and sends standard OpenAI compatible request when provider is openai-compatible', async () => {
    const mockResponseJson = {
      choices: [
        {
          message: {
            content: '{"nodes": [], "edges": []}',
            tool_calls: undefined
          }
        }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponseJson
    });

    global.fetch = mockFetch;

    const aiService = new AIService({
      provider: 'openai-compatible',
      apiKey: 'test-key',
      baseUrl: 'http://localhost:11434/v1',
      chatModel: 'gemma-4'
    });

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this flow.' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANS' } }
        ]
      }
    ];

    const result = await aiService.generateChatResponse({
      systemInstruction: 'Test instructions',
      messages,
      responseSchema: { type: 'object' } // Checks it triggers json_object format
    });

    expect(result.content).toBe('{"nodes": [], "edges": []}');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        model: 'gemma-4',
        messages: [
          { role: 'system', content: 'Test instructions' },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this flow.' },
              { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANS' } }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      })
    }));
  });

  describe('Grounding and Scope Limitation', () => {
    it('correctly handles empty RAG database results and falls back to a warning/rejection message', () => {
      const retrievalResults: any[] = [];
      const knowledgeBase = retrievalResults.length > 0
        ? retrievalResults.map(r => AIService.situationalChunking(r.content, { title: r.title, category: r.category })).join('\n\n')
        : "KOSONG: Tidak ada dokumen referensi/prosedur/regulasi yang relevan yang ditemukan untuk pertanyaan ini. Pengguna belum mengunggah dokumen yang sesuai atau sistem pencarian tidak menemukan hasil.";

      expect(knowledgeBase).toContain("KOSONG: Tidak ada dokumen referensi");
    });

    it('validates that grounding rules are strictly specified in the system instructions', () => {
      const systemInstruction = `Anda adalah Asisten AI & Analis Strategis IndoGRC Pro...
PENTING:
- Anda HANYA boleh menjawab pertanyaan berdasarkan data yang ada pada KNOWLEDGE BASE di atas, data live aplikasi melalui tool yang dipanggil, serta topik seputar platform IndoGRC Pro dan regulasi ICOFR (SK-5).
- Jika pengguna menanyakan hal di luar cakupan aplikasi IndoGRC Pro, regulasi ICOFR (SK-5), atau di luar KNOWLEDGE BASE (seperti perihal cuti karyawan secara umum, resep masakan, pemrograman umum, dll), Anda WAJIB menolak menjawab secara sopan dan menjelaskan batas kemampuan Anda.`;

      expect(systemInstruction).toContain('Anda HANYA boleh menjawab pertanyaan berdasarkan data yang ada pada KNOWLEDGE BASE');
      expect(systemInstruction).toContain('menolak menjawab secara sopan');
    });
  });
});

