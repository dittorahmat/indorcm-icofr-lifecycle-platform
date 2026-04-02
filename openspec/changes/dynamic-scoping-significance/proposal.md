## Why

Saat ini, status 'Significant' pada akun GL ditentukan hanya sekali pada saat data di-upload berdasarkan Performance Materiality (PM) yang aktif saat itu. Jika pengguna kemudian mengubah parameter materialitas (seperti benchmark, persentase, atau haircut), daftar akun tidak terupdate secara otomatis dan akun yang sebelumnya dianggap tidak signifikan (filtered out) tetap hilang dari tampilan. Perubahan ini bertujuan untuk membuat penentuan status signifikansi akun menjadi dinamis dan reaktif terhadap perubahan parameter materialitas.

## What Changes

- **Non-Filtering Import**: Mengubah logika upload GL agar tidak lagi melakukan filter terhadap akun di bawah PM. Semua akun GL akan disimpan dalam state `localAccounts`.
- **Reactive Significance Logic**: Memindahkan logika penentuan status `isQuantitative` dari tahap import ke tahap render atau state derivation. Status signifikansi akan dihitung ulang secara otomatis setiap kali `performanceMateriality` berubah.
- **Dynamic Status Badge**: Memperbarui kolom "Status" pada tabel 'Significant Accounts Matrix' agar mencerminkan hasil perhitungan dinamis (Significant vs Insignificant).
- **Visual Distinction**: Memberikan gaya visual yang berbeda untuk akun signifikan dan tidak signifikan agar pengguna mudah membedakannya.

## Capabilities

### New Capabilities
- `dynamic-account-significance`: Kemampuan sistem untuk menghitung ulang status signifikansi seluruh akun secara real-time berdasarkan parameter materialitas yang berubah.

### Modified Capabilities
- `gl-integration`: Mengubah cara data GL diproses setelah di-upload untuk mendukung penyimpanan seluruh dataset akun.

## Impact

- **Components**: `ScopingPage.tsx` (modifikasi `handleDataImported`, `isSignificant` logic, dan rendering table).
- **Data Flow**: `localAccounts` state akan menyimpan lebih banyak data dibandingkan sebelumnya.
- **UI/UX**: Pengguna dapat melihat dampak perubahan materialitas langsung pada seluruh daftar akun GL tanpa perlu re-upload data.
