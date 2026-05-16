## Why

Saat ini banyak elemen UI (terutama Sidebar dan Tabel RCM) memiliki konten yang sangat panjang. Scrollbar bawaan browser seringkali merusak estetika (tebal dan kaku) atau bahkan tidak muncul sama sekali sehingga konten terkesan "terpotong". Implementasi "On-Hover Scrollbar" akan memberikan pengalaman pengguna yang lebih bersih, modern, dan fungsional dengan hanya menampilkan scrollbar saat dibutuhkan.

## What Changes

- **Global Scrollbar Utility**: Penambahan class utility `.scrollbar-hover` di CSS global untuk menangani perilaku scrollbar yang transparan secara default dan muncul saat hover.
- **Sidebar Update**: Integrasi class `.scrollbar-hover` pada komponen `SidebarContent` untuk memastikan navigasi tetap bisa diakses di layar kecil.
- **RCM Table Update**: Integrasi class `.scrollbar-hover` pada komponen `RCMTable` untuk memudahkan navigasi data risk & control matrix yang masif (horisontal & vertikal).
- **Global UI Coverage**: Penerapan class ini pada elemen-elemen panjang lainnya seperti `DialogContent`, `SheetContent`, dan `DropdownMenuContent`.

## Capabilities

### New Capabilities
- `ui-scrollbar-behavior`: Standarisasi perilaku scrollbar di seluruh platform IndoGRC Pro untuk meningkatkan visibilitas konten panjang tanpa mengorbankan estetika UI.

### Modified Capabilities
- (Kosong - Tidak ada perubahan pada persyaratan fungsional bisnis, hanya peningkatan UX/UI)

## Impact

- **CSS**: Perubahan pada `src/index.css`.
- **Components**: Modifikasi pada `src/components/ui/sidebar.tsx`, `src/components/rcm/RCMTable.tsx`, dan potentially UI primitives lainnya di `src/components/ui/`.
- **User Experience**: Navigasi di area padat data (RCM) dan menu (Sidebar) menjadi lebih intuitif dan estetis.
