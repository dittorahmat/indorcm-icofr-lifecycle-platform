## 1. CSAList kartu mobile

- [x] 1.1 Tambah render kartu mobile (`md:hidden`: referensi & periode, hasil, tanggal, aksi Lihat/Cetak/Hapus 44px+) di `CSAList.tsx` dengan tabel desktop dibungkus `hidden md:block` tanpa perubahan markup desktop, dan verifikasi kedua mode tampil di test dual-render (`getAllByText`)
- [x] 1.2 Tambah string i18n untuk label kartu CSAList dan verifikasi tidak ada string hardcode baru via review diff

## 2. CSAForm stepper + upload kamera + aksi sticky

- [x] 2.1 Tambah stepper satu-sampel-per-layar (`md:hidden`: indikator "Sampel X dari N", Lanjut/Kembali, lompat-ke-sampel) di `CSAForm.tsx` berbasis indeks array `fields` sebagai state UI lokal tanpa mengubah `useCSA`, dan verifikasi navigasi stepper melintasi seluruh sampel di test dengan 3+ sampel
- [x] 2.2 Tambah tombol kamera (`capture="environment"`, 44px+) di samping tombol unggah standar pada baris sampel via `CSATabContent.tsx` memakai jalur `onFileChange → uploadMutation` yang sama, dan verifikasi foto masuk antrean unggah baris yang benar dengan indikator progres + aksi Coba Lagi saat gagal
- [x] 2.3 Tambah bar aksi sticky (Simpan Draft / Submit / Kembali, offset safe-area di atas `MobileBottomNav`) untuk viewport kecil dan verifikasi aksi terlihat dan terjangkau saat keyboard virtual terbuka di 360px
- [x] 2.4 Tambah string i18n untuk stepper, tombol kamera, dan bar aksi, dan verifikasi tidak ada string hardcode baru via review diff

## 3. Deficiency quick-wins

- [x] 3.1 Naikkan badge penghitung `DeficiencyBoard.tsx` dari `text-[10px]` ke `text-xs` dan verifikasi grep tidak menemukan `text-[10px]`/`text-[11px]` pada file papan
- [x] 3.2 Ubah Kanban multi-kolom menjadi tab tersegmentasi + aliran kartu vertikal per status di `<md` (kartu: kode, proses, severity, pemilik, tenggat; pindah status via kontrol 44px+ bukan drag) dengan papan desktop tidak berubah, dan verifikasi tidak ada scroll horizontal halaman di 360px

## 4. BPM read-only mobile

- [x] 4.1 Ubah `BPMDiagramList.tsx` menjadi kartu diagram (nama, proses induk, status, jumlah node) + search full-width di `<md` dan verifikasi ketuk kartu membuka viewer diagram yang benar
- [x] 4.2 Aktifkan mode read-only canvas (`nodesDraggable={false}`, tap-to-select) dengan toolbar/panel edit disembunyikan di `<md` dan penanda "Mode Lihat — sunting di desktop" yang selalu terlihat, dan verifikasi tidak ada kontrol edit yang terpicu di viewport 360px
- [x] 4.3 Tampilkan detail node dalam bottom-sheet read-only (risiko, kontrol, asersi + tautan CSA/RCM terkait) saat node diketuk di viewport kecil dan verifikasi seluruh atribut regulasi node terbaca tanpa scroll halaman
- [x] 4.4 Sajikan worksheet BPM, VerificationDesign, dan Lampiran6 Log sebagai ringkasan kartu + tabel penuh dalam container scroll terkunci (tanpa overflow halaman) di `<md` dan verifikasi halaman tidak bergeser horizontal di 360px
- [x] 4.5 Tambah string i18n untuk label Mode Lihat, bottom-sheet, dan ringkasan worksheet, dan verifikasi tidak ada string hardcode baru via review diff

## 5. Validasi akhir

- [x] 5.1 Tambah/ perbarui unit test dual-render (CSAList, CSAForm stepper, BPMDiagramList, DeficiencyBoard) mengikuti konvensi `getAllByText` + `closest()` dan verifikasi `npm test` hijau
- [x] 5.2 Jalankan `type-check`, `lint`, `build` sekuensial (satu per satu, output redirect ke file, tidak di-pipe) dan verifikasi semuanya hijau
- [x] 5.3 Verifikasi kepatuhan anti-AI-slop (min 12px, `rounded-md/lg`, tanpa glassmorphism/animasi dekoratif, tanpa italic data audit) dan tidak ada regresi desktop (tabel desktop byte-identik secara visual)
