# Standard Arsitektur & Tata Letak Tabel Kepatuhan (Table Architecture)

Dokumen ini adalah referensi definitif tata letak tabel kepatuhan IndoGRC Pro, mencakup tabel multi-level, sticky headers/columns, dan pencegahan kompresi kolom pada layout engine browser.

## 1. Multi-Level Headers & Penguncian Lebar Kolom (`<colgroup>`)
Dalam CSS standar (`table-layout: fixed`), browser hanya menghitung lebar kolom dari baris pertama elemen tabel.
Jika baris pertama adalah group header berkategori (`colSpan > 1`), browser akan **mengabaikan** atribut `width` pada `<th>` baris kedua dan membagi rata sisa ruang tabel, mengakibatkan kolom narasi tertekan/wrap secara parah.

### Aturan Wajib:
1. **Wajib `<colgroup>`:** Setiap tabel dengan header multi-level (`colSpan`) WAJIB menyematkan `<colgroup>` tepat di bawah elemen `<table>`.
2. **Spesifikasi `<col>`:** Tag `<col>` hanya merespons atribut `width` (serta `visibility`, `background`, `border`). Dilarang keras menyematkan `minWidth` atau kelas `min-w-*` pada `<col>` karena diabaikan oleh HTML/CSS spec. Ditegakkan secara mekanis via `npm run check:table-semantics`.
3. **Penguncian Sel (`<th>` & `<td>`):** Properti `width` dan `minWidth` WAJIB disematkan pada elemen sel (`<th>` dan `<td>`) dengan fallback aman (bukan `undefined`), misalnya:
   ```ts
   const getColumnWidth = (col: ColumnDef): string => col.width || '120px';
   const getCellStyle = (col: ColumnDef): React.CSSProperties => {
     const w = getColumnWidth(col);
     return { width: w, minWidth: w };
   };
   ```
4. **Anti-Duplikasi Kelas Ukuran:** Dilarang menyalin string utility ukuran kolom secara hardcoded antara `TableHead` dan `TableCell`. Wajib gunakan objek/map konfigurasi kolom bersama (misal `CSA_WORKLIST_COLUMNS`, `RCM_NARRATIVE_WIDTHS`).

## 2. Sticky Columns & Stacking Context (#169, #170)
- **Opaque Background:** Header dan kolom beku (*stickyLeft*) WAJIB menggunakan token latar belakang opaque lintas-tema (`bg-slate-50 dark:bg-card` untuk header dan `bg-white dark:bg-card` untuk body) agar tidak transparan saat scroll.
- **Stacking Levels:**
  - Sticky intersection cell (sudut kiri atas): `z-20`
  - Sticky header biasa: `z-10`
  - Sticky column body: `z-[2]`
- **Text Truncation:** Sel dengan pemotongan teks (`truncate` / `line-clamp-*`) WAJIB menyematkan atribut `title={...}` atau tooltip agar informasi tetap dapat diakses.

## 3. Inventori Tabel Kepatuhan Utama (Cross-Table Audit Checklist)
Setiap kali melakukan audit lebar kolom atau refactoring antarmuka tabel, pastikan memeriksa seluruh modul berikut:
- **RCM Matrices:** `RCMTable.tsx` (TLC, ELC, ITGC, Verification Design)
- **CSA Workbench:** `CSAWorklistTab.tsx`, `CSAPage.tsx`, `CSAReviewMatrix.tsx`
- **Application & SOC:** `ApplicationControlsTable.tsx`, `SocRepository.tsx`, `SignificantApplicationInventory.tsx`
- **Deficiencies & CAP:** `CAPTrackingTable.tsx`, `DoDTable.tsx`
- **Sampling & Testing:** `RegulatorySamplingTable.tsx`, `TODTable.tsx`, `TOETable.tsx`
- **Scoping & Materiality:** `GLSourceTable.tsx`, `GLDataGrid.tsx`, `MaterialityMatrixTable.tsx`, `ApprovalPage.tsx`
- **Regulatory Reports:** `changelog-report.tsx`, `findings-report.tsx`, `lampiran11-report.tsx`, `ManagementAssessment.tsx`

## Standar Visual Header Tabel & Kontras

- Seluruh tabel/grid baru wajib menggunakan komponen standar `Table`, `TableHeader`, `TableHead`, `TableRow`, `TableCell` dari `@/components/ui/table` tanpa override warna latar (`bg-slate-50/*`, `bg-white`, `bg-slate-100`), border ad-hoc, maupun `uppercase tracking-wider` pada `<TableHead>`.
- Untuk header tabel yang menempel (*sticky*), gunakan prop `<TableHeader sticky>` alih-alih menulis ulang utility `sticky top-0 bg-slate-50` secara manual.
- Saat menghapus latar belakang gelap (`bg-mancity-pattern`, `bg-slate-900`, dll.) dari `<TableHeader>`, wajib audit dan hapus `text-primary-foreground` / `text-white` pada seluruh `<TableHead>` anaknya agar teks header tetap kontras di atas latar terang (`bg-slate-50 dark:bg-card`).
