## 1. Spike & Dekomposisi Aman

- [x] 1.1 Spike skema `controlResults` (`worker/db/schema.ts` + `shared/types.ts`) dan verifikasi apakah JSONB fleksibel atau butuh migrasi Drizzle untuk `evidenceMeta`
- [x] 1.2 Pecah `CSAForm.tsx` (777 baris) menjadi stepper hook, evidence section, dan footer actions, dan verifikasi `npm run type-check` lolos per-tsconfig via redirect file
- [x] 1.3 Tambah `data-testid` (`csa-sample-stepper`, `evidence-capture-*`) dan verifikasi suite dual-render memakai `getAllByText` + `closest()` tetap hijau

## 2. Hook Evidence Terpadu + GPS Fase-1

- [x] 2.1 Implementasikan `useEvidenceUpload` (preview, kompres 1600px, metadata konsisten, retry tanpa kehilangan file) dan verifikasi unit test preview-gagal-retry lolos
- [x] 2.2 Tambahkan permintaan Geolocation paralel (timeout 10s, `maximumAge` 60s, `enableHighAccuracy: false`) dengan status `granted/denied/timeout/unavailable` dan verifikasi submit tetap bisa saat lokasi ditolak
- [x] 2.3 Migrasikan `CSAForm` dan `EvidenceCaptureButton` ke hook terpadu dan verifikasi kedua jalur mengirim payload identik (`csaId, sIdx, cId` + meta GPS)
- [x] 2.4 Tambahkan string i18n ID/EN (izin lokasi, "Lokasi tercatat", panduan aktifkan lokasi) dan verifikasi tidak ada hardcoded text via `npm run lint`

## 3. Execution Hub Role-Aware (B-minimal)

- [x] 3.1 Tambahkan helper `isFieldLini1(role, scheduleId)` dengan fallback aman (tampilkan semua tab bila role tak pasti) dan verifikasi Line 2/desktop tidak berubah
- [x] 3.2 Sembunyikan/lipat tab non-CSA untuk Line 1 dari agenda dan deep-link langsung ke form CSA (skip History), dan verifikasi alur Agenda -> Eksekusi -> Form dalam 1 langkah di 360px
- [x] 3.3 Sembunyikan aksi Line 2 (Print Appendix 7A, Excel, TOD verification) dari form eksekusi Line 1 dan verifikasi action bar hanya berisi Save Draft + Sign-off 44px

## 4. Copy Jujur & Validasi Terpadu

- [x] 4.1 Turunkan copy `Appendix7aDetailed` dari `forensicVerified` menjadi `Lokasi tercatat` untuk GPS Fase-1 dan verifikasi snapshot report berubah sesuai
- [x] 4.2 Pertahankan aturan sign-off (Pass wajib bukti, gagal = Ineffective) tanpa menjadikan GPS blocker dan verifikasi skenario submit-ditolak-lokasi tetap lolos
- [x] 4.3 Jalankan mandat AGENTS.md berurutan (`type-check` per-tsconfig redirect file, `lint`, `build`, `test`) dan verifikasi semua hijau tanpa eksekusi paralel berat
