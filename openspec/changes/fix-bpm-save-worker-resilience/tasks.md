## 1. Client-Side API Hardening & Payload Sanitization

- [x] 1.1 Perbarui `src/lib/api-client.ts` untuk memeriksa header `Content-Type` sebelum membaca response, dan tangkap status code HTTP (401, 404, 524, 500) dengan pesan error deskriptif saat server mengembalikan non-JSON (HTML/text). Verifikasi dengan unit test atau simulasi mock non-JSON response.
- [x] 1.2 Buat helper utilitas `sanitizeNodesForSave` di `src/components/rcm/editor/utils/sanitize-bpm-nodes.ts` untuk memfilter fungsi callback dan memvalidasi kebersihan node sebelum disimpan. Verifikasi dengan unit test payload sanitization.
- [x] 1.3 Integrasikan sanitasi node ke handler `onSave` di `src/components/rcm/BPMEditor.tsx`. Verifikasi bahwa data yang dikirim ke mutation adalah data serializable murni.

## 2. Backend BPM Service Batching & Resilience

- [x] 2.1 Tambahkan pemeriksaan awal keberadaan diagram (`Diagram Not Found` guard) di `BpmService.updateDiagram` (`worker/services/bpm-service.ts`) agar mengembalikan status 404 terstruktur saat diagram tidak ditemukan pasca wipeout. Verifikasi respon 404 pada ID invalid.
- [x] 2.2 Refactor fungsi `syncRisksAndControlsFromNodes` di `worker/services/bpm/bpm-sync.ts` untuk mengumpulkan ID risiko/kontrol dan melakukan batch query `inArray` alih-alih query sekuensial N+1. Verifikasi efisiensi query dan integritas data hasil sinkronisasi.
- [x] 2.3 Refactor fungsi `syncMappingsFromEdges` di `worker/services/bpm/bpm-sync.ts` untuk menggunakan batch insertion relasi risk-control. Verifikasi pemetaan edge tersimpan dengan benar.

## 3. Verification & Compliance Validation

- [x] 3.1 Jalankan `npm run type-check` untuk memastikan integritas tipe data TypeScript bebas error.
- [x] 3.2 Jalankan `npm run lint` untuk memastikan kepatuhan standar kode ESLint.
- [x] 3.3 Jalankan `npm test` untuk memverifikasi seluruh unit test (termasuk test baru untuk api-client dan sanitasi) lulus tanpa regresi.
- [x] 3.4 Jalankan `npm run build` untuk memverifikasi kompilasi frontend dan worker berhasil tanpa kegagalan.
