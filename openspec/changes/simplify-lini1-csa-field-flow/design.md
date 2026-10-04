## Context

See proposal.md Why. Current state: `BPMModal.tsx` (284 baris, 6 tabs, `w-[1600px] h-[95dvh]`) selalu menampilkan semua tab ke semua role; `CSATabContent.tsx` mendarat di `CSAList` (History) dulu; dua jalur upload divergen — `CSATabContent.maybeCompressImage` + `use-csa.uploadMutation` (FormData `{file}` saja, langsung-upload) vs `EvidenceCaptureButton` (preview-dulu, tanpa kompres, FormData `{file, csaId}`); `CSAForm.tsx` 777 baris (23 baris dari hard limit 800 LOC AGENTS.md) sehingga wajib dipecah sebelum tambah fitur; `controlResults` di `shared/types.ts:321-328` belum punya slot GPS; `forensic-utils.analyzeEvidenceMetadata` masih mock (Jakarta hardcoded); role Line 1 terdeteksi via `localStorage mockRole` + `auth-me` tanpa gate konsisten di `BPMModal`.

## Goals / Non-Goals

**Goals:**
- Satu pola upload (`useEvidenceUpload`) dipakai `CSAForm` + `EvidenceCaptureButton`: preview, kompres, metadata konsisten, retry.
- `BPMModal` role-aware minimal: Line 1 + `scheduleId` -> fokus CSA, tab lain hidden/collapsed, deep-link langsung ke form.
- GPS Fase-1 paralel, opsional, per-bukti, copy jujur.

**Non-Goals:**
- Rute `/field` fullscreen terpisah; EXIF parsing; WebAuthn asli; reverse-geocode/peta; antrean offline penuh; ubah aturan sign-off Effective.

## Decisions

1. **Satu hook `useEvidenceUpload`, bukan duplikasi per komponen.**
   Rationale: satu-satunya cara menjamin preview/kompres/metadata/retry identik. Hook membungkus: `maybeCompressImage` (pindah dari `CSATabContent`), `getCurrentPosition` paralel (timeout 10s, `maximumAge` 60s, `enableHighAccuracy: false`), state `pending/preview/failed`, dan `uploadMutation` tunggal ke `POST /api/upload`.
   Alternative: perbaiki masing-masing komponen terpisah — ditolak, divergensi akan terulang.

2. **GPS paralel dengan kamera, bukan sekuensial, dan tidak memblokir.**
   Rationale: 2 prompt beruntun (kamera + lokasi) menaikkan angka Block; lapangan basement/gudang harus tetap bisa kerja. SK-5 tidak mensyaratkan GPS untuk CSA sah.
   Alternative: jadikan GPS syarat submit — ditolak (melanggar regulasi + UX lapangan).

3. **Simpan `evidenceMeta` sejajar `evidenceUrl` di `controlResults[cId]`, bukan di `archiveLocation`.**
   Rationale: `archiveLocation` adalah lokasi dokumen fisik (teks bebas "Lemari A"), bukan lokasi pengambilan bukti. Mencampur keduanya mengotori audit trail.
   Alternative: kolom terpisah per-evidence table — dipertimbangkan kalau `controlResults` ternyata kolom ketat (lihat Open Questions); default tetap JSON sejajar agar tanpa join baru.

4. **B-minimal dulu (filter tab + skip History), bukan rute `/field` baru.**
   Rationale: `CSATabContent/CSAForm` sudah hidup dengan props `bpmProcessId/controls/scheduleId`; memutus ketergantungan `selectedSamples` dari tab Sampling lebih berisiko daripada menyembunyikan tab. Desktop Line 2 tidak tersentuh.
   Alternative: rute `/field/csa/:scheduleId` fullscreen — dicatat sebagai lanjutan, bukan scope ini.

5. **Pecah `CSAForm.tsx` sebelum tambah badge GPS/upload baru.**
   Rationale: 777/800 LOC hard limit AGENTS.md. Ekstrak `useSampleStepper` (state `mobileStep`), `EvidenceSection` (foto/file/preview/retry/komentar/pass-fail), dan `CSAFormFooter` (sticky actions). Tanpa ini, review akan menolak penambahan apapun.
   Alternative: tambah langsung — ditolak oleh mandat modularisasi.

## Risks / Trade-offs

- [Risk] Deteksi role Line 1 rapuh (`mockRole` + `auth-me`) -> tab yang salah sembunyi/tampil. Mitigation: helper `isFieldLini1(role, scheduleId, viewport)` tunggal + fallback aman (tampilkan semua tab kalau role tidak pasti), bukan sembunyikan agresif.
- [Risk] Geolocation mati di `http://` demo/IP lokal dan saat permission diblokir permanen. Mitigation: status `unavailable/denied` eksplisit + panduan aktifkan lokasi + retry; tidak ada spinner diam.
- [Risk] Skema `controlResults` ketat sehingga butuh migrasi Drizzle (`npx drizzle-kit push`) + backfill. Mitigation: spike skema dulu (task 0); dukung baca-tulis lama (proof tanpa meta tetap valid).
- [Risk] Copy "forensik" menyesatkan selama mock Jakarta masih ada. Mitigation: turunkan copy `Appendix7aDetailed` ke "Lokasi tercatat" + hapus klaim `forensicVerified` untuk GPS Fase-1.
- [Risk] Test dual-render (`hidden md:block` tetap render di jsdom). Mitigation: kunci kedua view via `getAllByText`/`data-testid` (`csa-sample-stepper`, `evidence-capture-*`, `agenda-card-*`) dan asersi scroll container via `closest()`, bukan `parentElement`.
- [Trade-off] `enableHighAccuracy: false` hemat baterai tapi akurasi 20-50m. Diterima untuk Fase-1 ("saya di site X"); akurasi ketat ditunda ke fase forensik.

## Migration Plan

1. Spike skema (baca `worker/db/schema.ts` `csaSamples.controlResults`): JSONB fleksibel -> kirim langsung; ketat -> tambah kolom + `drizzle-kit push` + backfill `gpsStatus: 'unavailable'` untuk bukti lama.
2. Land hook + pecah `CSAForm` + filter tab di belakang flag/kondisi role yang aman (default tampil penuh).
3. Aktifkan GPS Fase-1 + string i18n ID/EN; rollback = kembalikan ke langsung-upload lama dengan menyembunyikan badge lokasi (data meta lama diabaikan pembaca).
4. Validasi AGENTS.md: `type-check` per-tsconfig via redirect file (Windows OOM guard), `lint`, `build`, `test` berurutan (tidak paralel).

## Open Questions

- Apakah Lini 1 lapangan perlu panel diagram BPM readonly collapsed di mode fokus CSA (isyarat dari change `mobile-csa-field-bpm-readonly`)? Jika ya, desain lipatan konteks perlu satu slot diagram — tidak mengubah spec di atas, hanya isi collapsed area.
- Apakah `POST /api/upload` boleh menerima field meta tambahan tanpa perubahan worker validation? Spike kecil saat implementasi; fallback: kirim meta via body JSON terpisah jika multipart ditolak.
