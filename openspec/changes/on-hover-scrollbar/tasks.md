## 1. Global CSS Implementation

- [x] 1.1 Definisi class utility `.scrollbar-hover` di `src/index.css` menggunakan `@layer utilities`.
- [x] 1.2 Implementasi styling Webkit (`::-webkit-scrollbar`) untuk transparansi default dan visibilitas saat hover.
- [x] 1.3 Implementasi styling Firefox (`scrollbar-width` & `scrollbar-color`) untuk transparansi default dan visibilitas saat hover.
- [x] 1.4 Implementasi state `:active` untuk thumb scrollbar agar lebih kontras saat di-drag.

## 2. Component Integration

- [x] 2.1 Aplikasi class `.scrollbar-hover` pada `SidebarContent` di `src/components/ui/sidebar.tsx`.
- [x] 2.2 Aplikasi class `.scrollbar-hover` pada kontainer utama di `src/components/rcm/RCMTable.tsx`.
- [x] 2.3 Aplikasi class `.scrollbar-hover` pada UI primitives: `DialogContent`, `SheetContent`, dan `DropdownMenuContent`.
- [x] 2.4 Cleanup class `custom-scrollbar` yang lama jika sudah tidak relevan atau menggantinya dengan standar baru.

## 3. Validation and Quality Assurance

- [x] 3.1 Verifikasi visual pada Sidebar (hover & scroll).
- [x] 3.2 Verifikasi visual pada RCM Table (horizontal & vertical scroll pada hover).
- [x] 3.3 Verifikasi kompatibilitas Dark Mode (scrollbar tetap terlihat jelas).
- [x] 3.4 Jalankan `npm run type-check` untuk memastikan tidak ada error TypeScript.
- [x] 3.5 Jalankan `npm run lint` untuk memastikan standar kode tetap terjaga.
- [x] 3.6 Jalankan `npm run build` untuk memverifikasi hasil kompilasi akhir.
