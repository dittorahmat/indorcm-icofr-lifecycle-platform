## Context

Implementasi CSA saat ini masih bersifat deskriptif dan menempel langsung pada data Kontrol. Berdasarkan Regulasi SK-5 BUMN, CSA harus menjadi bukti audit (audit evidence) yang terpisah, dinamis (per periode), dan mencakup pengujian sampel transaksi. Kita perlu memigrasikan model data dari "last result" ke "historical records" dengan dukungan lampiran bukti fisik dan forensik.

## Goals / Non-Goals

**Goals:**
- Implementasi tabel `csa_records` dan `csa_samples` di database menggunakan Drizzle.
- Membuat komponen `CSAList` untuk navigasi riwayat pengujian.
- Membuat komponen `Lampiran7Form` yang mendukung mode "Manual" dan "ITAC" secara otomatis berdasarkan sifat kontrol.
- Implementasi penambahan baris sampel secara dinamis.
- Integrasi PDF generation (backend) untuk output Lampiran 7 yang rapi.
- Mendukung multi-bahasa (ID/EN) untuk semua label dan pesan error.

**Non-Goals:**
- Otomasi pengambilan sampel dari ERP (saat ini masih input manual oleh user).
- Alur persetujuan (approval) berjenjang yang kompleks (fokus pada self-assessment Lini 1).

## Decisions

### 1. Relational Data Model (1:N)
Data pengujian sampel akan dipisahkan ke tabel `csa_samples` untuk memudahkan agregasi dan analisis efektivitas di masa depan.
*Rationale:* Memungkinkan satu dokumen CSA memiliki puluhan sampel tanpa membuat satu baris data database menjadi terlalu besar (blob).

### 2. Smart Form Component Logic
Komponen form akan menggunakan `react-hook-form` dengan `useFieldArray` untuk menangani baris sampel dinamis. Tampilan kolom akan di-filter secara kondisional berdasarkan `control.nature`.
*Rationale:* Memberikan UX yang bersih bagi user; kolom ITAC hanya muncul jika kontrol memang bersifat Automated.

### 3. PDF Export via Backend
Menggunakan engine di worker/server untuk menghasilkan PDF.
*Rationale:* Memastikan format margin, logo, dan font konsisten di semua perangkat, berbeda dengan `window.print()` yang bergantung pada driver printer user.

### 4. Zero Tolerance Validation
Sistem akan secara otomatis memberikan *suggestion* status "Ineffective" jika terdapat minimal satu baris sampel yang memiliki `attributeResult` = `false`.
*Rationale:* Sesuai dengan FAQ No. 10 regulasi (zero tolerance approach).

## Risks / Trade-offs

- **[Risk]**: Ukuran payload API meningkat karena pengiriman array of samples.
  - **Mitigation**: Implementasi pagination pada list view dan limitasi jumlah sampel maksimum (misal: 100 sampel per CSA).
- **[Risk]**: Kompleksitas sinkronisasi i18n untuk field dinamis.
  - **Mitigation**: Menggunakan kunci transalasi yang standar (misal: `csa.attributes.A.label`).

## Migration Plan

1. Generate migrasi Drizzle untuk tabel baru.
2. Push migrasi ke database (PostgreSQL/Neon).
3. Update `shared/types.ts` dengan interface baru.
4. Refactor `CSATabContent.tsx` untuk menampilkan List View terlebih dahulu.
