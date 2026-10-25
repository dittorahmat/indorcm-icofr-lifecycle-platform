# 01: Core Master & Scoping Baseline Seed Data (Tahap 1)

**What to build:**
Pengguna dapat membuka modul Scoping & Materialitas untuk tahun buku 2026 dan langsung melihat data dasar PT Batubara Nusantara Sejahtera (Klaster Tambang/Energi) dengan baseline materialitas yang sudah disetujui (Approved), akun-akun signifikan (FSLI Pendapatan Batubara, Kas, Piutang, Biaya Tambang), dan Scoping Matrix.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Data simulasi materialitas 2026 (Approved) tersedia dengan nilai OM Rp 25 Miliar dan PM Rp 18.75 Miliar.
- [ ] Akun FSLI batubara (Pendapatan Penjualan Batubara, Kas & Bank, Piutang PLN/Domestik, Jasa Penambangan) tersedia di gl_rows dan simulasi.
- [ ] Mock scoping dan materialitas terintegrasi di `shared/mock-data.ts` dan seed database `worker/db/seed.ts`.
