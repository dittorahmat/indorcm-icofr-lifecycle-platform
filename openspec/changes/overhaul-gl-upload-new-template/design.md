# Design: Overhaul GL Upload & Scoping Logic

## Data Model Updates (`shared/types.ts`)

`GLRow` interface akan diperluas untuk menyimpan metadata pelaporan:
```typescript
export interface GLRow {
  ymd: string;
  entityCode: string;
  noGL: string;
  glDesc: string;
  currency: string;
  balance: number;
  fsliCode: string;
  // New Fields
  fsliName: string;      // Dari kolom "FSLI"
  kategori: string;      // "Neraca" atau "Laba Rugi"
  subKategori: string;   // "Aset", "Pendapatan", dll
  fsliBalance: number;   // Verifikasi agregasi
  noUrut: number;        // Display order
}
```

## Parsing Logic (`ScopingPage.tsx`)

Update fungsi `onDrop` untuk:
1. Menggunakan `detectGLColumns` guna mencari mapping kolom dinamis.
2. Melakukan trimming pada nilai header (case-insensitive).
3. Menggunakan `parseBalance` untuk menangani format angka akuntansi (kurung, titik, koma).

## Benchmarking Logic (`compliance-utils.ts`)

`calculateBenchmarkValue` akan diubah:
```typescript
export function calculateBenchmarkValue(glData: any[], benchmark: BenchmarkCategory): number {
  // 1. Coba mapping berdasarkan Sub_Kategori (Akurat)
  const subKategoriMap = {
    'Revenue': 'Pendapatan',
    'Pre-Tax Income': 'Laba/Rugi Sebelum Pajak',
    'Assets': 'Aset',
    'Equity': 'Ekuitas'
  };
  
  const targetSub = subKategoriMap[benchmark];
  const matching = glData.filter(row => row.subKategori === targetSub);
  
  if (matching.length > 0) {
    return matching.reduce((sum, row) => sum + Math.abs(row.balance), 0);
  }

  // 2. Fallback ke logic lama (pattern matching) jika kolom Sub_Kategori kosong
  // ... existing logic ...
}
```

## UI Hierarchy (`GLDataGrid.tsx`)

Grouping akan diubah dari `fsliCode` menjadi `fsliName` (Nama FSLI) untuk keterbacaan yang lebih baik. Detail akun tetap di level `GL_Desc`.
- Group 1: `fsliName`
- Row: `glDesc` (Account Description)
