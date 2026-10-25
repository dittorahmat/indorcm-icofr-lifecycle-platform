# 02: RCM BPM Visual Linkage & Transaksi Pembuktian (Tahap 2)

**What to build:**
Pengguna dapat membuka RCM Manager dan BPM Editor untuk melihat proses bisnis utama penjualan batubara dan pengadaan kontraktor tambang, dengan node visual Lampiran 3 lengkap, kontrol kunci (LOG-01, QC-01, BILL-01, ENG-01, ITGC-01) tertaut 100% tanpa unmapped controls, serta daftar transaksi riil untuk pembuktian.

**Blocked by:** 01-scoping-baseline.md

**Status:** ready-for-agent

- [ ] Diagram alur BPM Penjualan Batubara & Pengadaan Kontraktor memiliki simpul standar (Oval, Persegi, Belah Ketupat, Silinder, Hexagon).
- [ ] Kontrol kunci TLC dan ITGC tertaut secara eksplisit ke simpul alur BPM (`bpm_node_rcms` / `regulatoryPairs`).
- [ ] 50+ baris data transaksi batubara di `transaction_details` tertaut ke noGL dan subproses BPM.
- [ ] Tersedia di `shared/mock-data.ts` dan idempotent seed di `worker/db/seed.ts`.
