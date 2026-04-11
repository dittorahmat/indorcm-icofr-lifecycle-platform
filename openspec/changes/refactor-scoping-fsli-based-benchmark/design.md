# Design: FSLI-Based Benchmark & UI Refinement

## 1. Data Structure Updates (`shared/types.ts`)

`GLSnapshot` akan menyimpan daftar nama FSLI yang "ditandai" oleh user:
```typescript
export interface GLSnapshot {
  // ...
  benchmarkFsliNames: string[]; // List of selected FSLI names
}
```

`MaterialitySimulation` akan menggunakan basis yang dinamis:
```typescript
export interface MaterialitySimulation {
  // ...
  basis: string; // Now stores the FSLI Name selected as basis
}
```

## 2. API & Utility Logic

- **`compliance-utils.ts`**: Update `calculateBenchmarkValue` untuk menerima basis sebagai `string` (Nama FSLI) dan array `benchmarkFsliNames`. Rumusnya sederhana: Jumlahkan saldo akun GL yang `fsliName`-nya cocok dengan basis terpilih.
- **`user-routes.ts`**: Update endpoint mapping untuk menerima array string.

## 3. UI Component Changes

### `SetBenchmarkModal.tsx`
- Tampilan tabel dengan 2 kolom: `FSLI Name` dan `Benchmark?` (Checkbox).
- Menggunakan `benchmarkFsliNames` dari snapshot state.

### `ScopingPage.tsx`
- **Modal New Simulation:** Dropdown `Basis` akan mem-map isi dari `activeSnapshot.benchmarkFsliNames`. Jika array kosong, tampilkan pesan warning "Please set benchmark in Master Data first".
- **Sidebar & Title:** Update teks menjadi "Significant Account Identification".

### `GLDataGrid.tsx`
- **Column Visibility:** Set `noUrut` column visibility to `false` in `useReactTable` state, but keep it in column definition for sorting.
- **Badge Styling:** Ubah `Badge` class pada status "IN SCOPE" untuk meningkatkan padding dan ukuran teks.
- **Excel Export Utility:** Buat fungsi `handleExportExcel` yang meloop `table.getRowModel().rows` untuk mendapatkan data yang sudah ter-filter dan ter-group.

## 4. Excel Export Format
Output file akan memiliki struktur:
| Entity Code | FSLI | Account Description | Balance | Kuantitatif | ... | Scope |
|-------------|------|---------------------|---------|-------------|-----|-------|
| (FSLI Row)  | CASH | (Empty)             | 1.000.000| Significant | ... | IN SCOPE |
| 0101        | CASH | Petty Cash Site A   | 400.000  | Significant | ... | IN (QUAN) |
| 0101        | CASH | Cash in Bank        | 600.000  | Significant | ... | IN (QUAN) |
