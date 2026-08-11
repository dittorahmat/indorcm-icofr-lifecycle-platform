# Tasks: Perbaikan Upload PDF & RAG Indexing On-Premise

- [x] 1. Update Frontend PDF Worker Import <!-- id: 1 -->
  - Edit [`src/pages/knowledge/UploadDocumentModal.tsx`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/src/pages/knowledge/UploadDocumentModal.tsx)
  - Impor `pdf.worker.min.mjs` secara lokal via Vite `?url` import syntax
  - Hapus URL CDN `https://cdn.jsdelivr.net/...`

- [x] 2. Implement Server-Side PDF Fallback Extraction <!-- id: 2 -->
  - Edit [`worker/routes/ai-docs.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts)
  - Tambahkan logika fallback ekstraksi teks menggunakan `unpdf` jika `content` dari frontend kosong
  - Pastikan `processDocumentAsync` menerima `finalContent` yang sudah diekstraksi

- [x] 3. Create & Execute Re-indexing Script for Empty Documents <!-- id: 3 -->
  - Buat file `scripts/reindex-empty-documents.ts`
  - Ambil dokumen dengan chunk kosong (`2024peraturan tk eselon i005.pdf`) dari DB/storage
  - Ekstrak teks dan generate chunk RAG & vector embedding ke `icofr.document_chunks`
  - Jalankan script via `npx tsx scripts/reindex-empty-documents.ts`

- [x] 4. System Integrity & End-to-End Verification <!-- id: 4 -->
  - Re-restart backend service `icofr-backend`
  - Verifikasi query AI Chatbot & ketersediaan chunk di DB
