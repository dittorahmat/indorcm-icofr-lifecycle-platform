## Why

Pengguna IndoRCM Pro sering membutuhkan bantuan untuk memahami regulasi ICOFR yang kompleks (SK-5/DKU.MBU/11/2024, 119 halaman). Chatbot AI akan memberikan akses cepat ke pengetahuan tentang ICOFR langsung dari dalam dashboard, meningkatkan produktivitas dan pemahaman pengguna terhadap regulasi.

## What Changes

- **AI Chatbot Widget**: Floating action button (FAB) di dashboard yang membuka modal chat
- **Gemini API Integration**: Backend endpoint untuk berkomunikasi dengan Gemini 2.5 Flash Lite
- **Knowledge Base**: PDF regulasi SK-5/DKU.MBU/11/2024 sebagai context untuk AI
- **Environment Variable Setup**: Konfigurasi GEMINI_API_KEY untuk API authentication
- **Chat History**: LocalStorage-based conversation persistence

## Capabilities

### New Capabilities

- `ai-chatbot-ui`: Floating chat widget dengan modal dialog, chat history, dan input form
- `gemini-api-integration`: Backend endpoint `/api/ai/chat` untuk Gemini API communication
- `pdf-knowledge-base`: PDF text extraction dan context management untuk AI responses
- `chat-history-management`: LocalStorage-based conversation storage dan retrieval

### Modified Capabilities

None

## Impact

- **Frontend Components**: New chatbot UI components di Dashboard
- **Backend API**: New `/api/ai/chat` endpoint di Cloudflare Worker
- **Environment Variables**: GEMINI_API_KEY perlu ditambahkan di Wrangler config
- **Dependencies**: Google Generative AI SDK perlu ditambahkan
- **Bundle Size**: Tambahan ~50-100KB untuk chat UI components
- **API Costs**: Gemini API usage berdasarkan jumlah requests

## PDF Knowledge Base Analysis

**Document**: SK-5/DKU.MBU/11/2024 tentang ICOFR
- **Pages**: 119 halaman (117 halaman content)
- **Size**: ~234,493 characters
- **Structure**: 8 BAB, ~200+ Pasal, ~500+ Ayat
- **Tables**: 219 tabel

**MVP Approach**: Simple context injection (no RAG)
- Extract semua text dari PDF
- Pass sebagai system context ke Gemini API
- Token efficient untuk dokumen <300K characters
- Gemini 2.5 Flash Lite support context window besar
