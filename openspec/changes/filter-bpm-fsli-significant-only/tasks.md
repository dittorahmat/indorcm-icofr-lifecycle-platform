## 1. Type Update

- [x] 1.1 Update `MaterialitySimulation` interface di `shared/types.ts` untuk menyertakan `significantAccounts?: SignificantAccount[];`.

## 2. BPM Page Refactoring

- [x] 2.1 Hapus logika "Admin Bypass" di `significantFsliNames` memo di `src/pages/bpm/BPMPage.tsx`.
- [x] 2.2 Implementasi logika filter FSLI baru di `BPMPage.tsx` yang melakukan lookup ke `activeSim.significantAccounts`.
- [x] 2.3 Pastikan penanganan `activeSim` null atau `significantAccounts` kosong menampilkan dropdown kosong sesuai spec.

## 3. Verification

- [x] 3.1 Verifikasi dropdown FSLI di BPM hanya menampilkan item yang ada di daftar akun signifikan dari Scoping.
- [x] 3.2 Verifikasi login sebagai Admin tidak lagi mem-bypass filter signifikansi ini.
- [x] 3.3 Pastikan tidak ada regresi pada halaman Scoping setelah update tipe data.

