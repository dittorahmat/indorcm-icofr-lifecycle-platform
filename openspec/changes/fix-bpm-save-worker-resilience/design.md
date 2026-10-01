## Context

See proposal.md - Why.
Lingkungan Cloudflare Workers memiliki batas eksekusi ketat (CPU & latency limit per request) dan mengembalikan halaman HTML (seperti 524 Gateway Timeout, 401, atau 500) saat terjadi error internal atau timeout. Di sisi client, `src/lib/api-client.ts` secara naif memanggil `await res.json()` yang menyebabkan exception parsing JSON (`Unexpected token '<'`). Sementara di sisi backend, `worker/services/bpm-service.ts` mengeksekusi puluhan query sekuensial yang menyebabkan latensi tinggi saat diagram OCR berukuran besar disimpan.

## Goals / Non-Goals

**Goals:**
- Mengamankan `api-client.ts` agar menangani respons non-JSON (HTML/teks) dengan mengekstrak status HTTP dan pesan yang ramah pengguna.
- Mensterilkan state `nodes` di `BPMEditor.tsx` sebelum dikirimkan ke endpoint `PUT /api/bpm-diagrams/:id` untuk mencegah pengiriman closure/callback functions.
- Mengoptimasi `bpm-sync.ts` & `bpm-service.ts` dengan batch query (`inArray` & batch insert/update) untuk memangkas latensi dari >10 detik menjadi <1 detik.
- Mengembalikan error 404 terstruktur jika diagram ID yang ingin diperbarui tidak ditemukan di database (misal setelah wipeout demo).

**Non-Goals:**
- Merombak algoritma deteksi OCR atau mengubah AI prompt di worker/routes/bpm.ts.
- Mengubah skema database Drizzle atau migrasi PostgreSQL baru.

## Decisions

### 1. Robust Content-Type Checking di `src/lib/api-client.ts`
- **Keputusan**: Periksa header `content-type` dari respons `fetch`.
  - Jika `content-type` memuat `application/json`, parse dengan `res.json()`.
  - Jika tidak, baca dengan `res.text()`. Jika status 401/403, berikan pesan autentikasi/sesi berakhir. Jika status 524/504, berikan pesan timeout server. Jika status 404, berikan pesan data tidak ditemukan.
- **Alternatif yang ditolak**: Menggunakan regex pada string respons. Ditolak karena memeriksa header `content-type` adalah standar HTTP yang paling deterministik dan cepat.

### 2. Node Serialization & Sanitization di `BPMEditor.tsx`
- **Keputusan**: Buat helper fungsi `sanitizeNodesForSave(nodes)` yang hanya mengekstrak field serializable: `id`, `type`, `position`, `parentId`, `width`, `height`, `style`, `zIndex`, dan data inti (`label`, `department`, `function`, `regulatoryPairs`, dsb.) tanpa menyertakan `onToggleLock`, `onChangeDepartment`, dsb.
- **Alternatif yang ditolak**: Menggunakan `JSON.parse(JSON.stringify(nodes))`. Walau fungsi otomatis ter-strip oleh stringify, proses ini tidak membersihkan properti DOM transient yang mungkin bocor ke state.

### 3. Batch Query Optimization di `worker/services/bpm/bpm-sync.ts`
- **Keputusan**:
  - Ganti loop `for (const node of nodes) { await db.select()...; await db.insert()...; }` dengan mengumpulkan semua ID risiko & kontrol terlebih dahulu.
  - Lakukan 1 kali batch `SELECT ... WHERE inArray(id, ids)` untuk memverifikasi entitas yang ada di database.
  - Pisahkan entitas yang perlu di-insert dan di-update, lalu jalankan batch `INSERT` atau parallel upsert.
- **Alternatif yang ditolak**: Menjalankan query sekuensial dengan memperpanjang timeout. Ditolak karena Cloudflare Workers memiliki batas hard timeout yang tidak bisa dinaikkan tak terbatas.

### 4. Diagram Not Found Guard di `BpmService.updateDiagram`
- **Keputusan**: Cek `oldDiagram` di awal fungsi. Jika tidak ditemukan, langsung lempar exception `DiagramNotFound` atau kembalikan 404 terstruktur agar client dapat menampilkan peringatan yang tepat ke pengguna.

## Risks / Trade-offs

- [Risk] Batch insert pada database yang memiliki constraint relasi kompleks bisa gagal jika salah satu record tidak valid. → Mitigasi: Jalankan validasi kelengkapan data dasar sebelum melakukan batch insert, dan gunakan transaksi Drizzle yang rollback otomatis jika ada constraint violation.
- [Risk] Sanitasi nodes di frontend melewatkan atribut kustom baru yang ditambahkan di masa depan. → Mitigasi: Gunakan pendekatan omit function properties daripada whitelist atribut yang terlalu kaku.
