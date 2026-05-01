## Context

Sistem saat ini memiliki fungsionalitas CSA yang terfragmentasi di level kontrol individual. Pengguna operasional (Lini 1) merasa proses ini tidak efisien karena satu dokumen bukti (sampel) seringkali meng-cover banyak kontrol dalam satu sub-proses. Desain ini merombak workflow tersebut menjadi tersentralisasi di level sub-proses bisnis dengan dukungan penjadwalan visual.

## Goals / Non-Goals

**Goals:**
- Implementasi kalender operasional untuk manajemen jadwal pengujian dan remediasi.
- Penyatuan seluruh instrumen pengujian (RCM, Sampling, Assessment) ke dalam satu modal hub di `BPMPage`.
- Dukungan verifikasi multi-kontrol per baris sampel transaksi.
- Automasi sugesti status "Ineffective" berbasis Zero Tolerance.

**Non-Goals:**
- Otomasi penarikan data transaksi dari ERP (ETL) - *User akan upload excel manual atau pilih dari snapshot existing*.
- Workflow persetujuan bertingkat (Lini 2/3) yang kompleks di luar scope integrasi ini.

## Decisions

### 1. Data Modeling: Scheduling & Multi-Control Samples
Kita butuh entitas baru untuk merekam rencana pengujian sebelum eksekusi dilakukan.
- **`csa_schedules`**:
    - `id`, `organizationId`, `bpmProcessId`, `plannedDate`, `type` (CSA, TOD, TOE), `status` (Not Started, In Progress, Completed), `assignedTo`.
    - **Recurring Logic**: Saat jadwal dibuat dengan frekuensi (Monthly, Quarterly, dll), backend akan otomatis men-generate 12 instance (1 tahun) data jadwal ke depan.
- **Refactor `csa_samples`**:
    - Kolom `attrA..D` akan dideprecated (legacy support).
    - Kolom baru `controlResults: jsonb` yang menyimpan status centang per `controlId` dalam format `{ [controlId: string]: boolean }`.
    - Relasi ke `gl_rows.id` untuk traceability sampel transaksi asli.

### 2. Frontend Architecture: The Execution Hub
`BPMModal` akan diubah fungsinya menjadi `ExecutionHubModal`:
- Menggunakan `Radix Tabs` untuk navigasi internal.
- **Integrasi Kalender**: Tombol "Buka Execution Hub" di list tugas kalender akan memicu pembukaan modal ini dengan konteks sub-proses yang sesuai.
- **Workflow Optimasi (Gas Pol)**: Menghapus intermediate "BPM Consistency Gate". User diarahkan langsung dari riwayat asesmen ke Form CSA, dengan checkbox konfirmasi konsistensi yang terintegrasi di dalam form untuk tetap menjaga kepatuhan regulasi.

### 3. Localization & Unsaved Changes
- Lokalisasi akan dipindahkan ke namespace `csa_hub` di file JSON `en/csa.json` dan `id/csa.json`.
- Hook `useUnsavedChanges` akan dipasang di level Modal Hub untuk memonitor `isDirty` dari form worksheet maupun tabel assessment.

## Risks / Trade-offs

- **[Risk] Performa Render Tabel Lebar**: Jika satu sub-proses punya >10 kontrol, tabel assessment akan lambat.
  - *Mitigation*: Implementasi virtualization atau optimasi `React.memo` pada cell centang.
- **[Risk] Kompleksitas Migration**: Mengubah skema `csa_samples` berisiko merusak history data lama.
  - *Mitigation*: Gunakan migration script yang memigrasi data `attrA..D` lama ke format JSONB baru sebagai *initial state*.
- **[Trade-off] Redundansi Evidence**: Rumus (Ctrl x Sampel) mungkin menghasilkan jumlah bukti yang sangat banyak untuk di-upload satu per satu.
  - *Decision*: Dukungan upload 1 file evidence untuk multiple checkpoints dalam satu baris sampel.
