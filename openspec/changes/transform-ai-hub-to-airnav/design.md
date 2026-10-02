# Design: transform-ai-hub-to-airnav

## Context

Lihat `proposal.md` (Why) untuk motivasi. Kondisi saat ini: `src/components/reports/AIAnalyticsMockup.tsx` (~563 baris) me-render 3 tabs (Analytics / AI Cases / CCM) dan mengimpor `AI_MARITIME_DRILLDOWN_DATA` dari `shared/ai-maritime-data.ts`. Bentuk data drilldown sudah baku (`AIUseCaseDrilldown`: metrics, chart, findings — lihat `shared/types.ts`). Pola perubahan sebelumnya (banking, PELNI) adalah swap file data + label. Lihat `specs/ai-hub-airnav-mockup/spec.md` untuk kontrak perilaku.

## Goals / Non-Goals

Goals:
- Mengganti seluruh konten presentasi maritim dengan konten aviasi AirNav tanpa mengubah struktur tab dan pola drilldown.
- Menambah satu sumber data khusus aviasi yang terisolasi dan mudah dihapus/diganti untuk demo berikutnya.
- Menjaga kepatuhan mandat repo: i18n penuh, design-taste-frontend (tanpa AI slop), type-check/lint/build/test hijau.

Non-Goals:
- Tidak mengubah routing, auth, atau struktur `AIUseCaseDrilldown`.
- Tidak membangun integrasi data real-time (tetap mock presentasi).
- Tidak merefaktor arsitektur multi-entity data (tetap pola satu file per demo; restrukturisasi umum di luar scope).

## Decisions

1. **File data baru `shared/ai-aviation-data.ts` (bukan edit maritime file)**
   - Rationale: file maritim adalah artefak demo PELNI yang mungkin dipakai ulang; mengisolasi data aviasi memudahkan revert dan demo paralel.
   - Alternatif dipertimbangkan: edit langsung `ai-maritime-data.ts` — ditolak karena menghancurkan artefak PELNI dan mengaburkan riwayat demo.

2. **Rewire satu titik impor di `AIAnalyticsMockup.tsx` + label analitik/CCM inline**
   - Rationale: drilldown 6 engines mengalir dari satu record map, jadi swap impor + penyesuaian chart inline (AnalyticsTab memakai data hardcoded Jan-Jun dan OTP cluster) adalah perubahan minimal dengan risiko terkecil.
   - Alternatif: ekstrak komponen tab generik berbasis konfigurasi — ditolak, over-engineering untuk mock presentasi.

3. **Enam engine aviasi dipetakan 1-ke-1 dari enam engine maritim**
   - Rationale: mempertahankan jumlah kartu, layout grid, dan tipe chart (scatter/radar/bar) sehingga tidak ada perubahan layout; hanya semantik dan dataset yang berubah.
   - Pemetaan: bunker-anomaly → track-anomaly; predictive-docking → cns-maintenance; pso-ticket-recon → route-charges-recon; cargo-leakage → movement-leakage; port-disbursement-nlp → vendor-invoice-nlp; crew-payroll → atc-roster.

4. **i18n via kunci locale baru, bukan string inline**
   - Rationale: mandat repo mewajibkan tidak ada teks hardcoded; kunci baru mengikuti pola `src/i18n/locales/**` yang ada.

## Risks / Trade-offs

- [Risk] Sisa label maritim terlewat (string tersebar di AnalyticsTab/CCMTab inline, bukan hanya file data) → Mitigasi: grep `bunker|KM |PSO|cargo|pelabuhan|kapal|voyage` setelah perubahan; checklist verifikasi di tasks.
- [Risk] File mockup > 500 LOC (saat ini 563) bertambah → Mitigasi: tidak menambah komponen baru; bila perlu pecah sub-komponen mengikuti aturan modularisasi repo.
- [Risk] Chart aviasi memaksa tipe data yang tidak cocok (mis. scatter SFOC vs speed dipakai ulang untuk deviasi track) → Mitigasi: pertahankan tipe chart yang semantiknya masih masuk akal; ubah judul dan sumbu, bukan tipe.

## Migration Plan

- Deploy: perubahan frontend-only, tanpa migrasi DB. Rollback: kembalikan impor ke `ai-maritime-data.ts` dan revert label (satu commit).
- Urutan: data file baru → rewire impor → label Analytics/CCM → i18n → validasi mandat (type-check, lint, build, test).

## Open Questions

- Tidak ada yang menahan implementasi. Nada findings (safety vs defisiensi kontrol ICOFR) dapat disesuaikan saat review demo tanpa mengubah spec atau task breakdown.
