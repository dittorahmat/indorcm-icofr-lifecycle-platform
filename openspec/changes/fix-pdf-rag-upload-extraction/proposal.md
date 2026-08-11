# Proposal: Perbaikan Ekstraksi Upload PDF & RAG Indexing On-Premise

## Why (Mengapa Perubahan Ini Dibutuhkan?)
Saat mengunggah dokumen PDF (`2024peraturan tk eselon i005.pdf`) di halaman `/documents` pada environment On-Premise, fitur AI Chatbot merespons dengan pesan `KOSONG: Tidak ada dokumen referensi/prosedur/regulasi yang relevan...`. 

Setelah dilakukan investigasi, penyebab utamanya adalah:
1. Client-side PDF worker di [`UploadDocumentModal.tsx`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/src/pages/knowledge/UploadDocumentModal.tsx) meng-hardcode URL CDN eksternal `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`. Hal ini menimbulkan mismatch versi dengan versi library core `pdfjs-dist` di `node_modules` (`4.10.38`), serta berisiko terblokir di jaringan intranet On-Premise BUMN.
2. Kegagalan ekstraksi di client membuat frontend mengirim `content: ""`.
3. Backend tidak memiliki fallback server-side PDF parser ketika `content` bernilai kosong, sehingga pembentukan chunk RAG dan *vector embedding* di tabel `icofr.document_chunks` dilewati sepenuhnya (`0 chunks`).

## What (Apa yang Akan Diubah?)
- **Front-end PDF Worker bundling**: Membundel `pdf.worker.min.mjs` secara lokal dari `node_modules` menggunakan fitur Web Worker URL import bawaan Vite (`import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`).
- **Back-end Server-Side PDF Fallback**: Menambahkan fallback parser PDF di backend ([`worker/routes/ai-docs.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts)) menggunakan `unpdf` / `pdf-parse-fork` jika parameter `content` yang dikirim dari browser bernilai kosong.
- **Backfill/Re-index Dokumen Kosong**: Membuat script re-indexing cepat untuk memproses ulang dokumen yang sudah terlanjur diunggah dengan `content_len = 0` (`2024peraturan tk eselon i005.pdf`) agar langsung memiliki chunk RAG di database.

## Impact & Scope
- **File Terdampak**:
  - [`src/pages/knowledge/UploadDocumentModal.tsx`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/src/pages/knowledge/UploadDocumentModal.tsx)
  - [`worker/routes/ai-docs.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts)
  - [`scripts/reindex-empty-documents.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/scripts/reindex-empty-documents.ts) (script utilitas baru)
- **Modul Terdampak**: Knowledge Base (`/documents`) & AI Chatbot RAG.
