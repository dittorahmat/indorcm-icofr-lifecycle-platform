## Context

The current `gl-parser.ts` and `GLDataIntake.tsx` filter rows using `filter(r => r.glDesc)`. Ini terlalu restriktif karena baris subtotal atau header dalam laporan keuangan (seperti "TOTAL ASET") seringkali tidak memiliki deskripsi akun individual namun krusial untuk penentuan benchmark materialitas. Selain itu, `SetBenchmarkModal.tsx` mengurutkan grup FSLI secara alfabetis, yang tidak sesuai dengan struktur hierarkis laporan keuangan standar BUMN (SK-5/2024).

## Goals / Non-Goals

**Goals:**
- Melonggarkan filter import GL agar baris dengan `fsliName` tetap dipertahankan meskipun `glDesc` kosong.
- Mengimplementasikan pengurutan hierarkis di `SetBenchmarkModal` menggunakan nilai `minNoUrut` per grup FSLI.
- Mengintegrasikan hook `useUnsavedChanges` untuk mencegah kehilangan data pada pemilihan benchmark.
- Standarisasi lokalisasi (Indonesian/English) untuk seluruh teks UI terkait.
- Menambahkan notifikasi keberhasilan setelah benchmark disimpan.

**Non-Goals:**
- Mengubah skema database (menggunakan kolom `no_urut` dan `fsli_name` yang sudah ada).
- Mengubah logika kalkulasi nilai PM/OM itu sendiri.

## Decisions

### 1. Filter Import yang Lebih Toleran
**Keputusan**: Mengubah `.filter(r => r.glDesc)` menjadi `.filter(r => r.glDesc || r.fsliName)` di `gl-parser.ts` dan `GLDataIntake.tsx`.
**Rasional**: Memastikan baris subtotal "TOTAL ASET" masuk ke database sehingga bisa dipilih sebagai basis benchmark.

### 2. Pengurutan Hierarkis di UI
**Keputusan**: Di dalam `SetBenchmarkModal.tsx`, fungsi `uniqueFsliData` akan menghitung `min(noUrut)` untuk setiap grup FSLI. Hasil akhir diurutkan berdasarkan `minNoUrut` tersebut.
**Alternatif**: Menggunakan `no_urut` dari baris pertama setiap grup. Diputuskan menggunakan `min` untuk menangani ketidakkonsistenan data excel yang mungkin terjadi.

### 3. Integrasi UnsavedChanges
**Keputusan**: Menggunakan `useUnsavedChanges` dari `src/hooks/use-unsaved-changes.ts` (atau pattern serupa di project ini). State `isDirty` diaktifkan segera setelah pengguna mengubah pilihan checkbox benchmark.

### 4. Notifikasi
**Keputusan**: Memanggil `toast.success` dan (jika relevan) mengirimkan event ke sistem notifikasi internal setelah mutasi penyimpanan benchmark berhasil.

## Risks / Trade-offs

- **[Risk]** Data Excel memiliki `noUrut` yang salah atau duplikat. → **[Mitigation]** Jika `noUrut` kosong, berikan nilai default tinggi (999999) agar muncul di akhir, dan gunakan nama FSLI sebagai kriteria urut kedua.
- **[Risk]** Refactoring menyebabkan regresi pada endpoint API. → **[Mitigation]** Jalankan suite pengujian otomatis (`npm test`) dan verifikasi tipe data (`npm run type-check`) setelah refactoring.
