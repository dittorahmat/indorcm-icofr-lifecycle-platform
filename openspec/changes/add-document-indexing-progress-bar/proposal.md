# Proposal: Real-time Auto-updating Document AI Indexing Progress Bar

## Why (Mengapa Perubahan Ini Dibutuhkan?)
Saat mengunggah dokumen baru di `/documents`, proses ekstraksi teks dan *vector embedding* (RAG chunking) membutuhkan waktu 30 detik hingga 2 menit (tergantung ukuran PDF). Jika modal upload dibuat langsung sukses dalam 1-2 detik tanpa ada indikator status di tabel, pengguna dapat berasumsi AI Chatbot sudah selesai mempelajari dokumen tersebut padahal proses RAG masih berjalan di background. Sebaliknya, menahan modal spinner sampai 2 menit membuat pengguna mengira aplikasi mengalami *hang*.

## What (Apa yang Akan Diubah?)
- **Database Schema**: Menambahkan kolom `status` (`'processing'`, `'completed'`, `'failed'`) dan `indexing_progress` (`number 0 - 100`) pada tabel `icofr.documents`.
- **Backend API (`worker/routes/ai-docs.ts`)**:
  - Mengeset `status = 'processing'` & `indexing_progress = 0` saat dokumen baru disimpan.
  - Memperbarui persentase `indexing_progress` secara real-time di database setiap kali sekelompok chunk selesai diproses oleh Gemini API.
  - Mengeset `status = 'completed'` & `indexing_progress = 100` setelah seluruh chunk RAG berhasil di-index.
- **Frontend UI (`src/pages/knowledge/DocumentsPage.tsx`)**:
  - Menambahkan kolom **Status AI Indexing** di tabel daftar dokumen.
  - Menampilkan UI Progress Bar mini + persentase (e.g. `45%`) + animasi pulsing untuk dokumen yang berstatus `'processing'`.
  - Menampilkan badge hijau **Siap Ditanyakan (Ready)** saat status `'completed'`.
  - Mengaktifkan auto-polling (React Query `refetchInterval`) secara pintar *hanya jika* ada setidaknya satu dokumen yang masih berstatus `'processing'`, tanpa perlu me-refresh halaman (F5).

## Impact & Scope
- **File Terdampak**:
  - [`worker/db/schema.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/db/schema.ts)
  - [`worker/db/index.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/db/index.ts) (auto-migration column check)
  - [`worker/routes/ai-docs.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts)
  - [`src/pages/knowledge/DocumentsPage.tsx`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/src/pages/knowledge/DocumentsPage.tsx)
  - [`shared/types.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/shared/types.ts)
