## Context

**Current State:**
- Dashboard menampilkan informasi ICOFR (control coverage, deficiencies, dll)
- Tidak ada fitur bantuan/help dalam aplikasi
- Pengguna perlu membaca manual PDF regulasi (119 halaman) untuk memahami ICOFR
- Knowledge tentang regulasi tersebar dan sulit diakses cepat

**Constraints:**
- PDF regulasi: 234K characters, 119 halaman, 8 BAB, 200+ Pasal
- Cloudflare Workers environment (serverless)
- Gemini API memerlukan API key dari environment variable
- MVP harus simple, tidak perlu kompleksitas RAG/vector search

**Stakeholders:**
- Line 1 (Process Owner): Butuh guidance implementasi ICOFR
- Line 2 (ICOFR Manager): Butuh referensi cepat untuk decision making
- Line 3 (Internal Auditor): Butuh pemahaman testing requirements
- Admin: Need to manage API key and monitor usage

## Goals / Non-Goals

**Goals:**
- Floating chat button di dashboard (hover effect, tooltip)
- Modal chat dialog dengan conversation UI
- Integration dengan Gemini 2.5 Flash Lite API
- PDF knowledge base sebagai context untuk AI responses
- Chat history disimpan di LocalStorage
- Environment variable configuration untuk GEMINI_API_KEY
- Simple MVP tanpa RAG complexity

**Non-Goals:**
- Multi-session chat history (backend persistence)
- Voice input/output
- Multi-language support (hanya Bahasa Indonesia)
- Advanced features seperti file upload, image analysis
- Custom model fine-tuning
- Analytics/dashboard untuk chat usage

## Decisions

### 1. Gemini Model Selection

**Decision**: Gunakan `gemini-2.5-flash-lite`

**Rationale:**
- Stable model (bukan preview/deprecated)
- Optimized untuk speed dan cost
- Context window besar (~1M tokens)
- Cocok untuk Q&A tasks dengan context PDF
- 60% lebih murah dari Gemini Pro

**Alternatives Considered:**
- `gemini-2.0-flash`: Lebih capable tapi lebih mahal
- `gemini-1.5-flash`: Model lama, akan di-deprecate
- OpenAI GPT-4o-mini: Comparable tapi Gemini lebih integrated dengan Google Cloud

### 2. PDF Knowledge Base Strategy

**Decision**: Simple context injection (Option A - MVP)

**Approach:**
```
PDF → Extract Text → Store as String → Pass to Gemini as System Context
```

**Rationale:**
- PDF hanya 234K characters (~50K tokens)
- Gemini 2.5 Flash Lite handle context besar dengan baik
- Simple implementasi, tidak perlu vector database
- Cost masih reasonable untuk MVP

**Implementation:**
- Extract text sekali di build time / startup
- Simpan sebagai constant string di worker
- Include di system prompt setiap request

**Alternatives Considered:**
- **RAG (Retrieval Augmented Generation)**:
  - ✅ More scalable, efficient token usage
  - ❌ Butuh vector store (D1/Pinecone), embedding model, complex pipeline
  - ❌ Overkill untuk MVP
  
- **Hybrid (Chunking without vectors)**:
  - ✅ Simple keyword search
  - ❌ Less accurate, masih kompleks untuk MVP

### 3. Chat UI Architecture

**Decision**: Modal Dialog dengan Floating Action Button (FAB)

```
┌─────────────────────────────────────────┐
│  Dashboard                              │
│                                         │
│                           ┌─────────┐  │
│                           │   🤖    │  │ ← FAB (hover: scale + tooltip)
│                           └─────────┘  │
│                                 │      │
│                                 ▼      │
│                        ┌──────────────┐│
│                        │ Chat Modal   ││
│                        │ ┌──────────┐ ││
│                        │ │ Messages │ ││
│                        │ │  User:   │ ││
│                        │ │  AI:     │ ││
│                        │ └──────────┘ ││
│                        │ ┌──────────┐ ││
│                        │ │ Input 📤 │ ││
│                        │ └──────────┘ ││
│                        └──────────────┘│
└─────────────────────────────────────────┘
```

**Components:**
- `AIFabButton.tsx`: Floating button dengan hover effect
- `AIChatModal.tsx`: Modal dialog dengan chat interface
- `ChatMessageList.tsx`: Scrollable message list
- `ChatInput.tsx`: Text input + send button

**State Management:**
- Conversation history: React state + LocalStorage sync
- Modal open/close: Local state
- Loading state: React state

### 4. API Design

**Decision**: RESTful endpoint `/api/ai/chat`

**Request:**
```json
{
  "message": "Apa itu ICOFR?",
  "conversationHistory": [
    {"role": "user", "content": "..."},
    {"role": "model", "content": "..."}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "ICOFR adalah...",
    "sources": ["BAB II Pasal 3", ...]
  }
}
```

**Rationale:**
- Consistent dengan existing API patterns
- Conversation history enable contextual Q&A
- Simple error handling

### 5. Environment Variable Configuration

**Decision**: GEMINI_API_KEY di Wrangler config

**Location**: `wrangler.jsonc`
```jsonc
{
  "vars": {
    "GEMINI_API_KEY": "<api-key-here>"
  }
}
```

**Access in Worker:**
```typescript
const apiKey = c.env.GEMINI_API_KEY;
```

**Security:**
- API key tidak di-commit ke git
- Add ke `.gitignore`
- Document di README.md untuk setup

### 6. Chat History Persistence

**Decision**: LocalStorage only (client-side)

**Key**: `icofr_chat_history`

**Structure:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "timestamp": 1234567890,
      "messages": [
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
      ]
    }
  ],
  "currentConversationId": "uuid"
}
```

**Rationale:**
- Simple, no backend changes
- Fast access
- Sufficient untuk MVP

**Limitations:**
- History hilang jika clear browser cache
- Tidak sync across devices

## Risks / Trade-offs

**[Risk]** Gemini API cost bisa tinggi jika banyak usage

**→ Mitigation:**
- Implement rate limiting di backend
- Monitor API usage dengan logging
- Set budget alert di Google Cloud Console
- Educate user untuk pertanyaan yang relevan

**[Risk]** PDF context terlalu besar, response lambat

**→ Mitigation:**
- Test dengan sample questions dulu
- Jika lambat, implement chunking strategy
- Set timeout di API call (30s max)

**[Risk]** AI memberikan jawaban yang tidak akurat/hallucination

**→ Mitigation:**
- System prompt yang jelas: "Jawab hanya berdasarkan dokumen yang disediakan"
- Add disclaimer di UI: "AI dapat membuat kesalahan, verifikasi dengan dokumen asli"
- Include source references (BAB/Pasal) di response

**[Risk]** API key exposure di client-side

**→ Mitigation:**
- API key hanya di backend (Cloudflare Worker)
- Frontend call ke `/api/ai/chat`, tidak direct ke Gemini
- CORS restriction untuk prevent unauthorized access

**[Trade-off]** Simple context injection vs RAG

**→ Acceptable** karena:
- PDF size manageable (234K chars)
- MVP focus: validate concept dulu
- Bisa upgrade ke RAG nanti jika needed

**[Risk]** Cloudflare Worker cold start latency

**→ Mitigation:**
- Worker kecil, cold start minimal (~100-200ms)
- Gemini API call dominan latency anyway
- Consider Worker always-on jika perlu

## Migration Plan

### Steps to Deploy

1. **Extract PDF text** → `worker/knowledge-base.ts` (auto-generated)
2. **Add Gemini SDK** → `bun add @google/generative-ai`
3. **Create API endpoint** → `/api/ai/chat` di `worker/user-routes.ts`
4. **Add environment variable** → Update `wrangler.jsonc` dengan `GEMINI_API_KEY`
5. **Create UI components** → `AIFabButton.tsx`, `AIChatModal.tsx`, dll
6. **Integrate di Dashboard** → Add chatbot widget
7. **Test** → Verify chat functionality, error handling
8. **Deploy** → `bun run deploy`

### Rollback Strategy

- Remove UI components dari Dashboard
- Comment out `/api/ai/chat` endpoint
- Revert wrangler.jsonc changes
- Deploy ulang

## Open Questions

1. **Rate Limiting**: Berapa request limit per user per hari?
   - Suggestion: 100 requests/hari untuk MVP
   
2. **Conversation Context**: Berapa banyak message history yang dikirim ke API?
   - Suggestion: Last 10 messages untuk balance context vs token usage

3. **Error Messages**: Bagaimana handle berbagai error scenarios?
   - API key invalid
   - Rate limit exceeded
   - Timeout
   - Network error

4. **UI Customization**: Apakah perlu theme customization (dark mode support)?
   - Suggestion: Follow existing theme system

5. **Analytics**: Apakah perlu track chat usage metrics?
   - Suggestion: Simple logging dulu, analytics nanti
