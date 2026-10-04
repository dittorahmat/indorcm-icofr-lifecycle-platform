## Why

Lini 1 di lapangan (HP saja, tanpa desktop) harus mengisi CSA Lampiran 7 SK-5/DKU.MBU/11/2024 lewat alur yang hari ini dirancang untuk desktop: modal Execution Hub 6 tab (Worksheet, Sampling, RCM, CSA, Verification, Logs) yang mendarat di History dulu. Akibatnya banyak langkah dan keputusan yang bukan urusan Lini 1, plus dua cara upload bukti yang perilakunya beda (langsung-upload tanpa preview vs preview-tanpa-kompres, metadata tidak konsisten). GPS forensik masih mock (Jakarta hardcoded).

## What Changes

- **B-minimal (Execution Hub role-aware):** saat role Line 1 membuka Execution Hub dari agenda (`scheduleId` ada), hanya tab CSA yang tampil penuh; tab Worksheet/Sampling/RCM/Verification/Logs disembunyikan atau dilipat sebagai konteks readonly. Dari agenda langsung masuk form CSA (skip History).
- **B-UX lapangan:** sembunyikan aksi Lini 2 di jalur Lini 1 (Print Appendix 7A, Excel, TOD verification) dari form eksekusi; pertahankan stepper 1 sampel per layar, tombol 44px, grid satu kolom, sticky footer yang sudah ada.
- **C-unifikasi evidence:** satu perilaku upload di `CSAForm` dan `EvidenceCaptureButton`: pilih -> preview -> kompres (long-edge 1600px JPEG 0.82, reuse `maybeCompressImage`) -> unggah dengan metadata konsisten (`csaId, sIdx, cId`) -> gagal bisa retry tanpa pilih ulang.
- **GPS Fase-1 (izin lokasi dulu, EXIF menyusul):** minta `navigator.geolocation.getCurrentPosition` paralel saat tap foto (timeout 10s, `maximumAge` 60s, `enableHighAccuracy: false`); simpan `lat, lng, accuracyM, capturedAt, gpsStatus` per bukti sejajar `evidenceUrl`; GPS opsional (tidak memblokir submit); copy jujur "Lokasi tercatat" bukan "Forensik terverifikasi". EXIF parsing eksplisit di luar scope.
- **Batasan eksplisit (non-goals):** rute `/field` fullscreen terpisah, EXIF parsing, WebAuthn biometrik asli, reverse-geocode/peta, antrean offline penuh.

## Capabilities

### New Capabilities
- `csa-field-evidence`: pengambilan bukti lapangan Lini 1 — preview-sebelum-unggah, kompresi hemat kuota, retry tanpa kehilangan file, dan metadata GPS Fase-1 per bukti (opsional, tidak memblokir sign-off).

### Modified Capabilities
- `bpm-execution-hub`: Execution Hub menjadi role-aware untuk Line 1 dari agenda — fokus tab CSA, tab lain disembunyikan/dilipat, deep-link langsung ke form.
- `csa-management`: penyatuan perilaku upload bukti + penambahan metadata lokasi per bukti; validasi sign-off tetap (Pass wajib bukti) tanpa menjadikan GPS sebagai syarat sah.

## Impact

- Kode: `src/components/bpm/BPMModal.tsx` (filter tab role-aware), `src/components/bpm/CSATabContent.tsx` (hook upload + kompres terpusat), `src/components/bpm/CSAForm.tsx` (pakai hook terpadu + badge lokasi; pecah file 777 baris sebelum tambah fitur — dekat hard limit 800 LOC), `src/components/csa/EvidenceCaptureButton.tsx` (pakai hook yang sama), `src/hooks/use-csa.ts` (payload upload + `evidenceMeta`), `shared/types.ts` + `worker/db/schema.ts` (cek: kolom `controlResults` JSONB vs ketat — butuh spike; kemungkinan migrasi Drizzle), `src/i18n/locales/**/csa_hub.json` (string izin lokasi ID/EN + status GPS).
- API: `POST /api/upload` menerima metadata (`csaId, sIdx, cId, lat, lng, accuracyM, capturedAt, gpsStatus`); tidak ada endpoint baru.
- Sistem/dependensi: Geolocation API (HTTPS wajib; gagal anggun di `http://`/permission-denied); tanpa dependensi baru; pola dual-render test (`getAllByText`, `closest()`) tetap berlaku untuk view baru.
