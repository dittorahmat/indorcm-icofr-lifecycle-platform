# Spec: Integrated BPM Modal

## Purpose
Menyediakan antarmuka tunggal untuk pengelolaan proses bisnis dan pengendalian di tingkat transaksi tanpa harus berpindah halaman.

## Requirements
1.  **Popup Pemicu (Trigger Modal)**:
    - Klik pada nama akun di `GLDataGrid` atau tombol "Edit BPM" di `BPMPage` akan membuka modal.
    - Modal harus memuat data `BPMProcess` yang terkait dengan akun tersebut.
2.  **Struktur Data Header**:
    - Harus menampilkan Nama Proses (FSLI), Sub-Proses, dan No GL sebagai konteks.
3.  **Spreadsheet Worksheet Editor**:
    - Mendukung pengeditan baris/kontrol (CTRL-xxx) secara langsung.
    - Mendukung penambahan, penghapusan, dan pembaruan kolom standar SK-5 (IPO, Asersi, Tipe, Sifat, Aplikasi).
4.  **Integrated Flow Diagram (React Flow)**:
    - Tab terpisah untuk memvisualisasikan data worksheet sebagai diagram alur otomatis.
    - Simbol diagram harus sesuai regulasi (Hexagon untuk Risiko, dsb.).

## UI/UX Standards
- Modal berukuran besar (`max-w-7xl` atau layar penuh).
- Navigasi tab: `Worksheet`, `Alur Diagram`, `Log Perubahan`.
- Sticky header untuk menyimpan (Save) atau kirim persetujuan (Submit).

## Logic Rules
- Akses "Write" (Edit) hanya diberikan jika `currentUser.departmentId === account.assignedDepartmentId`.
- Perubahan tidak akan muncul di laporan efektivitas Lini 2 sampai statusnya menjadi `Approved` oleh Manager.
- Setiap kali worksheet disimpan (Save), sistem harus mengecek perbedaan data untuk dicatat di log.
