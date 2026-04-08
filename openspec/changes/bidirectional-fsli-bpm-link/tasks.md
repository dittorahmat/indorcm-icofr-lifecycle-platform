# Tasks: Bidirectional FSLI & BPM Linking

## 1. Data Foundation
- [x] 1.1 Update `shared/types.ts`: Tambahkan `fsliCodes` ke `Control` interface.
- [x] 1.2 Update `shared/types.ts`: Tambahkan `relatedProcessIds` ke `SignificantAccount` interface.
- [x] 1.3 Update `worker/user-routes.ts`: Pastikan update Control API menyimpan `fsliCodes`.

## 2. BPM Side: FSLI Linking
- [x] 2.1 Update `BPMEditor.tsx`: Tambahkan `pushNav` level baru untuk FSLI details.
- [x] 2.2 Update `BPMEditor.tsx`: Implementasi dropdown selector untuk FSLI dari data Scoping yang signifikan.
- [x] 2.3 Update `BPMEditor.tsx`: Tampilkan daftar FSLI yang terhubung di bawah Control details.

## 3. Scoping Side: Navigation & Traceability
- [x] 3.1 Update `ScopingPage.tsx`: Tambahkan kolom link 🔗 ke BPM di tabel Akun Signifikan.
- [x] 3.2 Update `RCMList.tsx`: Implementasi auto-expand/filter jika ada `fsliCode` di URL query params.

## 4. Reporting & Validation
- [x] 4.1 Update `RegulatoryAppendices.tsx`: Refactor `Lampiran11Report` untuk ambil data FSLI asli (bukan mock).
- [x] 4.2 Verifikasi: Buat defisiensi baru dan pastikan kolom FSLI di laporan terisi otomatis.
