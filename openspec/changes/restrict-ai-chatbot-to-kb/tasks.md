## 1. Backend Implementation

- [x] 1.1 Perbarui `systemInstruction` di [ai-docs.ts](file:///C:/backup/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts) untuk menambahkan aturan strict grounding (membatasi jawaban hanya pada dokumen KNOWLEDGE BASE yang diunggah dan domain aplikasi IndoGRC Pro/SK-5, serta menolak pertanyaan off-topic seperti pedoman cuti umum).
- [x] 1.2 Sesuaikan prompt sistem untuk mengidentifikasi situasi ketika hasil pencarian dokumen kosong atau memiliki skor kecocokan yang sangat rendah sehingga AI secara proaktif menginformasikan keterbatasan data dokumen.

## 2. Testing & Validasi

- [x] 2.1 Tambahkan skenario uji baru di [ai-service.test.ts](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/test/ai-service.test.ts) untuk memvalidasi bahwa AI menolak pertanyaan off-topic (misalnya pertanyaan seputar cuti umum, resep masakan, dll).
- [x] 2.2 Jalankan `npm run type-check` untuk memastikan tipe TypeScript aman.
- [x] 2.3 Jalankan `npm run lint` untuk memastikan kepatuhan standar penulisan kode.
- [x] 2.4 Jalankan `npm test` untuk memastikan semua skenario pengujian sukses tanpa regresi.
