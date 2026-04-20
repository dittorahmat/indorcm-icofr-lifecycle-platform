## 1. Skema Data & Tipe

- [x] 1.1 Update interface `Control` di `shared/types.ts` dengan atribut `level`, `relatedControlIds`, dan `attachmentUrl`.
- [x] 1.2 Update skema database (Drizzle) jika diperlukan untuk sinkronisasi atribut baru.

## 2. Logika Backend & Validasi

- [x] 2.1 Implementasi pengecekan relasi pada API handler penghapusan kontrol.
- [x] 2.2 Tambahkan logic untuk menolak penghapusan ELC jika ID-nya masih ditemukan di `relatedControlIds` milik kontrol lain.

## 3. Antarmuka RCM Manager (Tab UI)

- [x] 3.1 Refaktor `RCMPage` menggunakan komponen `Tabs` dari Shadcn/UI.
- [x] 3.2 Implementasi Tab TLC (menampilkan data control dengan `level: "TLC"`).
- [x] 3.3 Implementasi Tab ELC (menampilkan data control dengan `level: "ELC"`).
- [x] 3.4 Tambahkan proteksi akses pada Tab ELC: hanya tampil jika user memiliki role `Line 2` atau `Admin`.

## 4. Integrasi BPM & Linkage

- [x] 4.1 Modifikasi `BPMModal` untuk menambahkan field multiselect "Link to ELC Policy".
- [x] 4.2 Update `BPMEditor` untuk menambahkan dekorator visual icon "Shield" pada node kontrol yang memiliki linkage.
- [x] 4.3 Implementasi tooltip pada node kontrol di BPM untuk menampilkan daftar kebijakan ELC yang terkait.

## 5. Lokalisasi & Navigasi

- [x] 5.1 Tambahkan key baru untuk istilah ELC dan TLC pada file translasi di `src/i18n/`.
- [x] 5.2 Pastikan link navigasi di Sidebar mengarah ke default tab yang benar.
- [x] 5.3 Implementasi fitur upload file PDF pada form pembuatan/edit kontrol ELC.
