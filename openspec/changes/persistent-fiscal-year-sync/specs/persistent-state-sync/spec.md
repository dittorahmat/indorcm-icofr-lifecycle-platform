## ADDED Requirements

### Requirement: Persistensi State di LocalStorage
Sistem MUST menyimpan state `workingYear` ke dalam `localStorage` browser agar pilihan user tetap terjaga saat refresh halaman atau membuka tab baru.

#### Scenario: Pilihan tahun tersimpan otomatis
- **WHEN** user mengganti tahun fiskal di header
- **THEN** sistem MUST memperbarui nilai di `localStorage` secara instan

### Requirement: Sinkronisasi State Antar Tab
Sistem MUST melakukan sinkronisasi pilihan tahun fiskal di seluruh tab browser yang terbuka pada domain yang sama secara otomatis.

#### Scenario: Sinkronisasi instan saat storage berubah
- **WHEN** storage event terdeteksi (perubahan dari tab lain)
- **THEN** sistem MUST memperbarui state `workingYear` di tab saat ini agar sesuai dengan tab pengubah

#### Scenario: Blokir sinkronisasi jika ada data belum disimpan
- **WHEN** storage event terdeteksi TETAPI status `isDirty` aktif (ada unsaved changes)
- **THEN** sistem MUST mengabaikan sinkronisasi otomatis untuk mencegah kehilangan data konteks pada form
