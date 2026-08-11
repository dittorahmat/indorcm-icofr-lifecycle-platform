# Design: Bundling PDF Worker Lokal & Server-Side PDF Fallback RAG

## Architectural Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ALUR BARU UPLOAD PDF & RAG                         │
└─────────────────────────────────────────────────────────────────────────────┘

  [1. User Upload PDF] 
           │
           ▼
  [2. Browser Extract Text (pdfjs-dist)]
   ├── Menggunakan Vite bundled Worker (pdfjs-dist/build/pdf.worker.min.mjs?url)
   └── 100% Offline & Versi Selalu Match dengan Core PDFJS
           │
           ▼
  [3. POST /api/documents (File + Extracted Content)]
           │
           ▼
  [4. Backend Handler (ai-docs.ts)]
   ├── Check `content` parameter
   ├── IF `content` IS EMPTY:
   │    └── Fallback: Run `extractTextFromPdfBuffer(arrayBuffer)` via `unpdf`/`pdf-parse-fork`
   └── Save document & continue to Granular RAG Chunking
           │
           ▼
  [5. Granular RAG Chunking & Vector Store]
   ├── Split text into 3000 chars chunks
   ├── Generate embeddings via Gemini API
   └── Insert into `icofr.document_chunks` (FTS + Vector)
```

## Detailed Component Design

### 1. Client PDF Worker (`src/pages/knowledge/UploadDocumentModal.tsx`)
Ganti pendefinisian `GlobalWorkerOptions.workerSrc` dari CDN eksternal menjadi import bundel Vite lokal:
```typescript
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
```

### 2. Backend Fallback PDF Extractor (`worker/routes/ai-docs.ts`)
Di route `POST /documents`:
```typescript
let finalContent = content;
if (!finalContent || finalContent.trim().length === 0) {
  try {
    const { extractText } = await import('unpdf');
    const { text } = await extractText(arrayBuffer);
    finalContent = Array.isArray(text) ? text.join('\n') : (text || '');
  } catch (extractErr) {
    console.error('[API] Server-side PDF extraction fallback failed:', extractErr);
  }
}
```

### 3. Re-indexing Script (`scripts/reindex-empty-documents.ts`)
Tulis script TypeScript runnable via `npx tsx` yang:
1. Mengambil seluruh baris di `icofr.documents` di mana `content_len = 0` atau `document_chunks` = 0.
2. Mengambil file PDF dari R2/Local storage bucket.
3. Melakukan ekstraksi teks server-side dan membuat chunk & vector embedding baru di `icofr.document_chunks`.

## Verification Criteria
- [ ] Upload PDF baru di `/documents` berhasil mengekstraksi teks di browser tanpa error worker mismatch.
- [ ] Jika client sengaja mengirim `content = ""`, server-side fallback berhasil membaca isi PDF.
- [ ] Tabel `icofr.document_chunks` terisi chunk teks & vector embedding.
- [ ] AI Chatbot di `/documents` dapat mengenali dan menjawab pertanyaan berdasarkan isi `2024peraturan tk eselon i005.pdf`.
