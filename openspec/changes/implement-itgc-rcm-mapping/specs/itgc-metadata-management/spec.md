## ADDED Requirements

### Requirement: Input Metadata TI Spesifik
Sistem SHALL menyediakan input field untuk "Jenis Pengendalian Otomatis" dan "Aplikasi Pendukung" pada form properti ITGC di BPM Editor.

#### Scenario: Input Kontrol Otomatis TI
- **WHEN** user membuka form properti pada node aktivitas dengan kategori ITGC dan memilih Sifat Pelaksanaan sebagai "Automated"
- **THEN** sistem menampilkan dropdown "Jenis Pengendalian Otomatis" dengan pilihan: Automated Control, Automated Calculation, Restricted Access, Interface.
- **AND** sistem menampilkan input text "Aplikasi Pendukung" untuk diisi nama aplikasinya.

### Requirement: Tooltip Edukatif Domain ITGC
Sistem SHALL menampilkan tooltip penjelasan untuk setiap domain ITGC (Access, Development, Changes, Operations) guna membantu user melakukan klasifikasi yang tepat.

#### Scenario: Melihat Tooltip Domain
- **WHEN** user melakukan hover pada pilihan domain ITGC
- **THEN** sistem menampilkan deskripsi yang bersumber dari Bab III 2.2.c.3 SK-5/2024.
