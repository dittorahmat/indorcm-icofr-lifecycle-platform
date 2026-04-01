## ADDED Requirements

### Requirement: API Endpoint `/api/ai/chat`

Sistem SHALL menyediakan endpoint POST `/api/ai/chat` untuk komunikasi dengan Gemini API.

**Request Schema:**
```typescript
{
  message: string;           // User's current message
  conversationHistory: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
}
```

**Response Schema:**
```typescript
{
  success: boolean;
  data: {
    response: string;        // AI response text
    sources?: string[];      // Optional: referenced sections (BAB/Pasal)
  };
  error?: string;            // Error message if success is false
}
```

**Error Handling:**
- 400: Invalid request body
- 401: Invalid/missing GEMINI_API_KEY
- 429: Rate limit exceeded
- 500: Gemini API error
- 504: Timeout (>30 seconds)

#### Scenario: Successful chat request
- **WHEN** user mengirim pesan valid
- **THEN** sistem mengembalikan response dengan success: true

#### Scenario: Invalid request body
- **WHEN** request body tidak lengkap/malformed
- **THEN** sistem mengembalikan 400 Bad Request

#### Scenario: Missing API key
- **WHEN** GEMINI_API_KEY tidak configured
- **THEN** sistem mengembalikan 401 Unauthorized

### Requirement: Gemini API Integration

Sistem SHALL mengintegrasikan dengan Google Gemini API menggunakan model `gemini-2.5-flash-lite`.

**SDK**: `@google/generative-ai` (official Google SDK)

**Configuration:**
```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  systemInstruction: systemPrompt
});
```

**System Prompt:**
```
Anda adalah Asisten AI ICOFR yang membantu pengguna memahami regulasi 
Pengendalian Internal atas Pelaporan Keuangan (ICOFR) berdasarkan 
SK-5/DKU.MBU/11/2024.

Jawablah pertanyaan dengan akurat berdasarkan dokumen yang disediakan.
Sebutkan referensi BAB dan Pasal jika relevan.

Jika pertanyaan tidak terkait ICOFR, jawab dengan sopan bahwa Anda hanya 
dapat membantu pertanyaan tentang ICOFR.

Bahasa: Bahasa Indonesia
```

#### Scenario: Gemini API dipanggil
- **WHEN** user mengirim pertanyaan
- **THEN** sistem memanggil Gemini API dengan message + conversation history

#### Scenario: Response diterima
- **WHEN** Gemini API mengembalikan response
- **THEN** sistem forward response ke client

#### Scenario: API error
- **WHEN** Gemini API error (network, quota, dll)
- **THEN** sistem mengembalikan error message yang user-friendly

### Requirement: Environment Variable Configuration

Sistem SHALL membaca GEMINI_API_KEY dari environment variables di Cloudflare Worker.

**Location**: `wrangler.jsonc` vars section

**Access Pattern:**
```typescript
const apiKey = c.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY not configured");
}
```

**Security:**
- API key tidak boleh di-commit ke git
- Tambahkan ke `.gitignore`
- Document setup di README.md

#### Scenario: API key configured
- **WHEN** GEMINI_API_KEY ada di environment
- **THEN** sistem dapat memanggil Gemini API

#### Scenario: API key missing
- **WHEN** GEMINI_API_KEY tidak ada
- **THEN** sistem mengembalikan error 401

### Requirement: Conversation Context Management

Sistem SHALL mengirimkan conversation history ke Gemini API untuk contextual responses.

**Context Limit**: Last 10 messages (5 user + 5 AI)

**Rationale:**
- Balance antara context dan token usage
- Gemini handle conversation turns dengan baik
- Prevent context window overflow

**Format:**
```typescript
conversationHistory.map(msg => 
  `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}`
).join('\n')
```

#### Scenario: Contextual response
- **WHEN** user mengirim follow-up question
- **THEN** AI response mempertimbangkan conversation history

#### Scenario: Context limit
- **WHEN** conversation > 10 messages
- **THEN** sistem hanya mengirim 10 messages terakhir

### Requirement: Rate Limiting

Sistem SHALL implement basic rate limiting untuk prevent API abuse.

**Limit**: 100 requests per user per day (MVP)

**Implementation:**
- Track request count di localStorage (client-side)
- Backend validate request count
- Reset counter setiap 24 jam

**Error Response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Silakan coba lagi besok."
}
```

#### Scenario: Within rate limit
- **WHEN** user belum exceed limit
- **THEN** request diproses normal

#### Scenario: Rate limit exceeded
- **WHEN** user exceed 100 requests/day
- **THEN** sistem mengembalikan error 429
