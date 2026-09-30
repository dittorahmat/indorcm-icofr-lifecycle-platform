## 1. Global Shell & Navigation Viewport Clearance

- [x] 1.1 Perbarui `RootLayout.tsx` dan `MobileBottomNav.tsx` untuk menyertakan padding aman (`env(safe-area-inset-bottom)`) dan clearance vertikal dinamis agar tidak menutupi footer atau aksi bawah.
- [x] 1.2 Sesuaikan offset vertikal `AIFabButton.tsx` pada viewport mobile agar melayang di atas `MobileBottomNav` dengan jarak aman (`bottom-20` atau `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`) dan verifikasi tombol tidak saling bertumpukan.
- [x] 1.3 Optimalkan `MainHeader.tsx` dan `FiscalYearSelector.tsx` untuk viewport sempit (< 768px): sesuaikan target sentuhan minimal 44x44px dan buat pill pemilih tahun buku menjadi ringkas tanpa memicu horizontal overflow.

## 2. Executive Dashboard Mobile Optimization

- [x] 2.1 Refaktor `DashboardKPIs.tsx` agar tampilan kartu KPI di mobile mempertahankan rasio kontras, tipografi tegas (angka metrik tidak terpotong), dan ukuran font minimal 12px (`text-xs`).
- [x] 2.2 Implementasikan tampilan kartu progres bertingkat (*stacked card view*) pada `CSARealizationTable.tsx` untuk layar mobile (`< md`), berdampingan dengan tampilan tabel desktop (`>= md`).
- [x] 2.3 Periksa dan sesuaikan area sentuh pada tombol tindakan di `ActionCenter.tsx` agar ergonomis untuk pengoperasian satu tangan di ponsel.

## 3. Verifikasi & Kepatuhan Standar BUMN

- [x] 3.1 Verifikasi kelengkapan lokalisasi multi-bahasa (ID & EN) pada seluruh teks label baru di `src/i18n/locales/**`.
- [x] 3.2 Jalankan pengujian tipe data `npm run type-check` dan pastikan tidak ada kesalahan TypeScript.
- [x] 3.3 Jalankan linter dan format check `npm run lint` untuk memastikan kepatuhan standar kode.
- [x] 3.4 Jalankan pengujian otomatis `npm test` untuk memverifikasi tidak ada regresi fungsional.
