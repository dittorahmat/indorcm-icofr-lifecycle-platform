## Context

Menghubungkan akun finansial dengan sistem IT saat ini bersifat manual dan rawan kesalahan. Peraturan SK-5 mewajibkan identifikasi "Aplikasi Signifikan" berdasarkan dampaknya terhadap pelaporan keuangan untuk menentukan cakupan audit ITGC.

## Goals / Non-Goals

**Goals:**
- Sentralisasi pengelolaan aplikasi IT sebagai Master Data.
- Otomatisasi penandaan signifikansi aplikasi berdasarkan hasil scoping akun material.
- Memberikan peringatan visual (red font) untuk celah dokumentasi (aplikasi signifikan yang belum memiliki kontrol di RCM).
- Sinkronisasi data aplikasi di seluruh modul (Scoping, Matriks TLC, dan Matriks ITGC).

**Non-Goals:**
- Mengotomatisasi proses audit ITGC itu sendiri (hanya tahap identifikasi/scoping).
- Pengelolaan aset IT menyeluruh (hanya aplikasi yang relevan dengan ICOFR).

## Decisions

- **Relational Mapping (Table Join)**: Menggunakan tabel join formal `simulation_account_applications` alih-alih menyimpan array ID di kolom JSONB. Hal ini untuk memudahkan pelaporan silang (misal: "Daftar Akun yang diproses oleh SAP") dan performa query.
- **Alur "Add on the fly"**: Komponen Combobox di UI akan menawarkan opsi "Tambah [Nama]..." jika pencarian tidak ditemukan. Ini akan men-trigger `POST /api/applications` dengan `isSignificant: true` secara instan agar data konsisten.
- **Logika Validasi Visual**: API `/api/applications` akan mengembalikan field `linkedControlCount`. Jika nilai ini `0` untuk aplikasi yang dipilih di Scoping, maka UI akan merendernya dengan warna merah (`text-destructive`) untuk memperingatkan auditor bahwa kontrol untuk aplikasi tersebut belum didokumentasikan di RCM.
- **Sinkronisasi RCM (ID-Based)**: Kolom `supportingApp` di Matriks TLC dan ITGC akan diubah menjadi `applicationId` (Foreign Key). Input UI akan menggunakan `Select` komponen dengan `app.id` sebagai value. Data legacy berbasis teks akan tetap dipertahankan di kolom lama untuk referensi, namun link fungsional akan menggunakan ID.
- **Relational Integrity**: Menambahkan kolom `applicationId` pada tabel `rcm_controls` yang mereferensikan tabel `applications`.
- **Manajemen CRUD Terpusat**: Fitur Add, Edit, dan Delete aplikasi diintegrasikan dalam halaman Inventory Aplikasi. Penghapusan aplikasi menyertakan konfirmasi untuk mencegah hilangnya referensi kontrol secara tidak sengaja.
- **Manual ITGC Mapping Contextual**: Pemetaan manual ke 4 area ITGC (Access, Changes, Dev, Ops) dilakukan di dalam dialog Create/Edit aplikasi alih-alih di tabel utama. Hal ini untuk memastikan perubahan dilakukan secara sengaja dan didampingi informasi lengkap (label teks penuh di dialog, inisial dengan tooltip di tabel).

## Risks / Trade-offs

- [Risk] Duplikasi nama aplikasi (misal: "SAP" dan "sap"). → [Mitigation] Implementasi pengecekan unik case-insensitive di backend saat pembuatan aplikasi baru.
- [Risk] Beban query pada worksheet besar. → [Mitigation] Gunakan subquery efisien di backend untuk menghitung `linkedControlCount` dan optimalkan state management di frontend dengan TanStack Query.
- [Risk] Perubahan skema pada data yang sudah ada. → [Mitigation] Skrip migrasi akan mencoba memindahkan data teks lama dari kolom `supportingApp` ke tabel aplikasi jika memungkinkan, atau membiarkannya sebagai data legacy.
