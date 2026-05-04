## Context

Sistem menyimpan relasi antara Diagram BPM dan RCM di tabel `rcm_controls`. Saat ini, logic pembersihan di `PUT /api/bpm-diagrams/:id` membatasi penghapusan mapping hanya untuk risiko yang didefinisikan secara lokal di diagram tersebut (`rcm.diagramId = diagramId`). Ini menyebabkan risiko yang berasal dari library (tanpa `diagramId`) meninggalkan "sampah" mapping jika dikurangi atau dihapus dari kanvas visual.

## Goals / Non-Goals

**Goals:**
- Mengubah logic sinkronisasi relasi agar berbasis pada seluruh risiko yang aktif di kanvas diagram saat ini (*Source of Truth*).
- Menjamin pembersihan otomatis mapping yang sudah tidak ada di visual editor (hard-cleanup).
- Sinkronisasi angka `riskCount` dan `controlCount` pada tabel `bpm_processes` setiap kali diagram disimpan secara akurat.

**Non-Goals:**
- Tidak mengubah skema database existing.
- Tidak mengubah cara kerja library risiko global (hanya cara diagram berinteraksi dengannya).

## Decisions

### 1. Canvas-State Mapping Sync
- **Pilihan**: Menghapus mapping `rcm_controls` berdasarkan `rcm_id` yang aktif di kiriman UI (diagram JSON), tanpa memedulikan asal-usul risiko tersebut.
- **Rasional**: Diagram adalah manifestasi visual dari proses. Jika user menghapus garis hubungan di layar, mapping di database harus hilang untuk diagram tersebut.
- **Implementasi**: Backend akan mengambil semua `activeRiskIds` dari `body.nodes`. Untuk setiap risiko tersebut, hapus baris di `rcm_controls` yang `control_id`-nya tidak ada dalam daftar yang dikirim dari UI.

### 2. Manual Data Repair Script
- **Pilihan**: Membuat script `scripts/repair-bpm-summary.ts`.
- **Rasional**: Memperbaiki data historis yang sudah "kotor" (seperti proses "Penarikan Tunai") tanpa harus memaksa user melakukan re-save manual pada ratusan diagram. Script ini akan melakukan rekalkulasi total per sub-proses.

## Risks / Trade-offs

- **[Risk]** → Menghapus mapping yang mungkin digunakan di diagram lain jika risiko yang sama dipakai bersama secara tidak sengaja.
- **[Mitigasi]** → Sistem saat ini mendesain relasi kontrol bersifat spesifik per konteks risiko. Kita akan memastikan pembersihan hanya menargetkan mapping yang benar-benar tidak terdeteksi di diagram aktif.
