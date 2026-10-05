## 1. Shell & Layout Overflow Normalization

- [x] 1.1 Perbaiki wrapper layout di `src/components/layout/RootLayout.tsx` dan `src/components/layout/AppLayout.tsx` untuk menghapus overflow clip ganda dan memastikan scroll container vertikal memiliki batas horizontal `min-w-0 max-w-full overflow-x-hidden`. Verifikasi dengan mengecek layout tidak memotong child container di 360px.
- [x] 1.2 Sesuaikan container utama `Dashboard.tsx` dengan memastikan semua pembungkus `motion.div` dan grid induk menerapkan `w-full max-w-full min-w-0` tanpa margin negatif yang menabrak batas layar. Verifikasi seluruh kartu dashboard berada dalam viewport di 360px.

## 2. Component-Level Mobile Responsive Fixes

- [x] 2.1 Perbaiki `<LifecycleProgress>` agar stepper horizontal dan status header memiliki pembungkus berisolasi dengan padding aman serta proteksi flex-wrap agar tidak terpotong di tepi kanan. Verifikasi stepper mobile tampil penuh dan scrollable dengan mulus di 360px.
- [x] 2.2 Perbaiki `<DashboardKPIs>` untuk memastikan layout kartu metrik eksekutif dan KPI berjalan rapi dalam 1 kolom vertikal di mobile tanpa terpotong di kanan. Verifikasi nilai KPI dan subtitle terbaca lengkap di 360px.
- [x] 2.3 Perbaiki `<ActionCenter>` dengan menerapkan `min-w-0 flex-1` pada blok teks judul dan deskripsi serta `shrink-0` pada badge status/persentase di sisi kanan agar badge tidak terdorong keluar layar. Verifikasi seluruh baris aksi dan badge persentase terlihat utuh di 360px.
- [x] 2.4 Perbaiki `<ComplianceCharts>` pada grafik batang (Bar Chart) dengan membungkus chart dalam container scroll horizontal terisolasi `overflow-x-auto touch-pan-x` dan Donut Chart diposisikan di tengah (`cx="50%"`, `cy="50%"`) dengan container fleksibel agar lingkaran grafik tampil utuh dan simetris di tengah. Verifikasi Bar Chart dan Donut Chart tidak terpotong di 360px.
- [x] 2.5 Perbaiki `<COSOCoverageGrid>` dengan mengubah grid kolom prinsip menjadi adaptif (`grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-3`) dan teks subtitle memiliki `line-clamp-2` atau wrap yang rapi. Verifikasi tidak ada kartu prinsip P1–P17 yang terpotong di tepi kanan pada 360px.

## 3. Testing, Verification, and Anti-Regression

- [x] 3.1 Buat unit test baru atau perbarui test yang ada di `src/pages/__tests__/Dashboard.test.tsx` untuk memastikan semua komponen dashboard ter-render dengan benar di container tanpa crash. Jalankan `npm test` dan verifikasi seluruh test suite lulus.
- [x] 3.2 Lakukan verifikasi tipe dengan `npm run type-check` dan linting dengan `npm run lint`. Verifikasi keduanya exit dengan kode 0 tanpa error.
