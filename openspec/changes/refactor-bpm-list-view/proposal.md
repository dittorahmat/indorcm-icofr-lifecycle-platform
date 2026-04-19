# Proposal: Refactor BPM List View to Table Grid with Backend Aggregation

## Context
Saat ini, halaman BPM menggunakan tampilan berbasis tombol/kartu untuk menampilkan proses bisnis di bawah akun GL yang dipilih. Hal ini menyulitkan pengguna ketika terdapat banyak sub-proses dalam satu akun (potensi "tenggelam" dalam daftar). Selain itu, pengguna membutuhkan gambaran cepat (summary) mengenai jumlah risiko dan kontrol yang tercakup dalam setiap sub-proses tanpa harus membuka flowchart satu per satu.

## Goals
1. Mengubah visualisasi daftar BPM dari kartu menjadi **Table List** (Data Grid).
2. Menambahkan fitur **Search Bar** untuk mencari sub-proses di dalam akun GL terpilih.
3. Memindahkan tombol **"Create BPM"** ke posisi yang lebih menonjol di depan (header tabel).
4. Menambahkan **Summary Columns** (Total Risk & Total Control) yang dihitung di sisi server (Backend Aggregation).
5. Memastikan metadata **Perusahaan** dan **Lokasi** muncul di baris tabel sesuai standar regulasi SK-5.

## Proposed Changes

### Frontend (BPMPage.tsx)
- Ganti barisan tombol `bpmProcesses.items.map(...)` dengan komponen `<Table />` dari Shadcn/UI.
- Implementasi kolom tabel:
  - **Aksi**: Tombol ikon "Open/Edit Flow" (membuka `BPMModal`).
  - **Sub Proses**: Nama dari `BPMProcess`.
  - **Perusahaan**: Diambil dari `selectedGLRow.entityCode` (lookup ke nama perusahaan).
  - **Lokasi**: Kode entitas dari `selectedGLRow.entityCode`.
  - **Summary Risiko**: Menampilkan `bpm.riskCount` (data baru dari API).
  - **Summary Kontrol**: Menampilkan `bpm.controlCount` (data baru dari API).
- Tambahkan `<Input />` sebagai search bar di atas tabel yang memfilter data lokal `bpmProcesses.items`.

### Backend (Cloudflare Workers / Drizzle)
- **Tipe Data**: Tambahkan `riskCount: number` dan `controlCount: number` ke interface `BPMProcess` di `shared/types.ts`.
- **API `/api/bpm-processes`**:
  - Modifikasi query SQL untuk menyertakan agregasi:
    ```sql
    SELECT bpm.*, 
           COUNT(DISTINCT controls.id) FILTER (WHERE controls.is_fraud_risk = false) as risk_count,
           COUNT(DISTINCT controls.id) as control_count
    FROM bpm_processes bpm
    LEFT JOIN controls ON bpm.id = controls.bpm_process_id
    GROUP BY bpm.id
    ```
  - Pastikan filter `noGL` tetap berfungsi untuk scoping per akun.

## User Experience Flow
1. User memilih FSLI dan GL Account.
2. Muncul tabel berisi daftar sub-proses (BPM).
3. User bisa mengetik di search bar untuk mempersempit daftar.
4. User melihat summary (misal: Sub-proses A punya 5 Risiko & 10 Kontrol).
5. User klik "Open" untuk masuk ke editor visual (React Flow).

## Constraints
- **1 BPM = 1 Flowchart**: Tetap mempertahankan integritas 1:1 antara header proses dan canvas flowchart.
- **Regulatory**: Tetap mencantumkan Owner (Departemen) di atas tabel sesuai kewenangan akses.
