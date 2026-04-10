# Design: Unified Scoping Control Center

## 1. Unified Table View (List View)

Kita akan menggunakan `Table` dari Shadcn/UI untuk menggantikan seluruh sistem kartu (`Card`) di halaman utama Scoping.

### Tabel Master Data GL (Snapshot)
- **Kolom:**
  1. `Active`: Indikator radio/bullet (Hijau jika aktif).
  2. `File Name`: Nama file yang diupload.
  3. `Upload Date`: Tanggal unggah.
  4. `Status`: Badge "Mapped" atau "Draft".
  5. `Actions`: Tombol Set Active, Set Benchmark, dan Delete.

### Tabel Simulation Scenarios
- **Kolom:**
  1. `Name`: Judul simulasi.
  2. `Status`: Approved/Pending/Draft.
  3. `Basis`: PBT/Revenue/dll.
  4. `PM Value`: Angka nilai PM final.
  5. `Source GL`: Nama file GL yang digunakan.
  6. `Created Date`: Tanggal pembuatan.

## 2. Active Snapshot Intelligence

- **API Logic:** Saat user melakukan `POST /api/gl-snapshots/:id/set-active`, sistem akan mengupdate semua snapshot lain milik perusahaan tersebut menjadi `isActive: false` dan snapshot target menjadi `isActive: true`.
- **Auto-Select:** Jika tabel snapshot kosong lalu user upload 1 file, sistem otomatis mengeset snapshot tersebut sebagai active.
- **Form Integration:** Saat klik "New Simulation", field `Source GL` akan otomatis terisi dengan Snapshot yang sedang aktif di Master Data.

## 3. Worksheet UI Cleanup (`GLDataGrid.tsx`)

- **Removal:** Seluruh referensi ke `omValue` (sebagai kolom) dan ikon petir dihapus.
- **Kuan Column (Kuantitatif):**
  - **Header:** Tetap menggunakan label "Kuan".
  - **Values:** 
    - Jika `Math.abs(balance) >= pmValue` -> Label: **Significant** (Badge Merah).
    - Jika `Math.abs(balance) < pmValue` -> Label: **Not Significant** (Text-slate-400).
- **8 pillars:**
  ```typescript
  const pillars = [
    "Kecurangan", "Volume", "Kompleksitas", "Karakteristik", 
    "Kerumitan", "Kewajiban Kontingensi Signifikan", 
    "Ada transaksi pihak berelasi", "Volalitas"
  ];
  ```
- **Level Assessment:** Logika `onAssessmentChange` akan dipanggil di level baris grup (FSLI Header). State `assessmentData` di `MaterialitySimulation` akan menggunakan `fsliName` sebagai kunci utama.

## 4. API & Storage Updates

- **`GLSnapshot` Schema:**
  ```typescript
  interface GLSnapshot {
    // ...
    isActive: boolean;
    benchmarkMapping: Record<string, string>; // { "Kas dan Bank": "Cash", ... }
  }
  ```
- **Calculation Fallback:** Jika `benchmarkMapping` ada, gunakan itu untuk agregasi nilai basis. Jika tidak ada, kembalikan 0.
