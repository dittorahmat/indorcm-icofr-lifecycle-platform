## 1. Database & Localization Setup

- [x] 1.1 Verifikasi skema database Drizzle untuk model `MaterialitySimulation` dan jalankan `npx drizzle-kit generate` jika diperlukan penambahan index.
- [x] 1.2 Update file i18n (`src/i18n/locales/en/bpm.json` dan `id/bpm.json`) untuk label status "Baseline" dan pesan peringatan `Unsaved Changes`.

## 2. Source Correction (Scoping Module)

- [ ] 2.1 Modifikasi `significantAccounts` mapping di `src/pages/scoping/ScopingPage.tsx` agar menggunakan `row.fsliName` untuk field `name` dan `row.fsliCode` untuk field `fsliCode`.
- [ ] 2.2 Pastikan simulasi baru yang di-save atau di-submit memiliki struktur data FSLI yang benar di database.

## 3. BPM Auto-Healing & Logic Refinement

- [x] 3.1 Modifikasi query `active-simulation` di `src/pages/bpm/BPMPage.tsx` untuk memfilter simulasi dengan status `Approved` saja.
- [x] 3.2 Implementasi logic sorting `createdAt` descending pada hasil filter untuk mendapatkan baseline terbaru.
- [ ] 3.3 Implementasi "Auto-Healing" pada variabel `significantFsliNames` di `BPMPage.tsx`. Jika data `sa.name` terdeteksi sebagai detail GL, lakukan lookup ke `activeSnap` untuk mendapatkan Nama FSLI yang sebenarnya.
- [ ] 3.4 Perbaiki filter `glNumbers` agar sinkron dengan hasil healing tersebut.

## 4. Safety & UX Integration

- [x] 4.1 Sempurnakan sinkronisasi antara `localAssertion` dan data dari API agar state "dirty" terdeteksi dengan akurat.
- [x] 4.2 Pastikan `isAssertionDirty` mencakup semua field asersi (E, C, A, Co, Ro, Va, Pd).
- [x] 4.3 Letakkan komponen `UnsavedChangesDialog` di `BPMPage.tsx`.
- [x] 4.4 Tambahkan Empty State UI ketika tidak ditemukan simulasi yang `Approved` untuk tahun terpilih.

## 5. Verification & Testing

- [ ] 5.1 Uji coba simulasi lama (PBT) dan pastikan dropdown FSLI menampilkan "Kas dan Setara Kas", bukan "Kas-Bank".
- [ ] 5.2 Pastikan setelah memilih FSLI yang sudah di-heal, dropdown GL Account di bawahnya terisi dengan benar.
- [ ] 5.3 Buat simulasi baru di Scoping dan verifikasi datanya tersimpan dalam format FSLI yang benar di database.
- [x] 5.4 Jalankan `npm run lint` dan `npm run build` untuk memastikan tidak ada regresi.
