## Why

Pengguna menginginkan agar tampilan matriks RCM TLC dan RCM ITGC menjadi flat tanpa pemisah biru (`RCMGroupRow`) yang mengganggu kontinuitas pembacaan dan sering memicu nilai `NULL - ...`. Selain itu, penamaan kolom `Process Information` dan `Sub Process` perlu diselaraskan dengan taksonomi hierarki BPM parent-child (`FSLI -> GL -> Process (Parent) -> Sub Process (Child)`), di mana `Process Information` murni menampilkan nama proses induk (beserta BPM Code proses induk), dan `Sub Process` menampilkan nama sub-proses (child). Terakhir, seluruh matriks RCM (TLC, ELC, dan ITGC) memerlukan kemampuan ekspor data langsung ke format Excel (.xlsx) untuk kebutuhan audit dan dokumentasi eksternal.

## What Changes

- **RCM TLC Matrix Flat View**: Menghapus baris pemisah banner biru (`RCMGroupRow`) secara permanen dari tabel matriks TLC sehingga seluruh baris kontrol tersaji secara flat, bersih, dan berkesinambungan.
- **RCM ITGC Matrix Flat View**: Menghapus baris pemisah banner biru (`RCMGroupRow`) secara permanen dari tabel matriks ITGC untuk konsistensi tampilan flat antarmuka RCM.
- **Kolom Process Information & Sub-Process TLC**:
  - Kolom **Process Information** diubah murni menampilkan nama Proses Induk (Parent Process) beserta kodenya `[BPM Code]`, tanpa memuat teks GL / FSLI yang berlebihan.
  - Kolom **Sub Process** menampilkan nama Sub-Proses anak (Child Process).
- **Backend API Hierarki RCM (`/api/rcm-matrix/tlc`)**: Memperbaiki query resolver data RCM TLC agar melakukan lookup ke hierarki `bpm_processes` (`parentId` -> parent process), sehingga nama proses induk dan nama sub-proses anak selalu terisi tepat dan tidak null.
- **Export to Excel (.xlsx)**:
  - Menyediakan helper ekspor modular yang mengubah data matriks kontrol menjadi file Excel yang rapi dengan header kolom lengkap.
  - Menambahkan tombol aksi **"Export Excel"** pada header `RCMTLCPage`, `RCMELCPage`, dan `RCMITGCPage`.
- **Localization (i18n)**: Menambahkan teks lokalisasi multi-bahasa (ID/EN) untuk tombol ekspor dan pesan notifikasi.

## Capabilities

### New Capabilities
- `rcm/matrix-excel-export`: Fungsionalitas ekspor data matriks RCM (TLC, ELC, ITGC) ke format spreadsheet Excel (.xlsx) dengan pemetaan kolom komprehensif.

### Modified Capabilities
- `rcm/tlc-hierarchy-flat-view`: Penyesuaian tampilan matriks TLC dan ITGC menjadi flat tanpa pemisah grup, serta penyesuaian kolom Process Information (Parent Process) dan Sub-Process (Child Process).

## Impact

- **Frontend Pages**:
  - `src/pages/rcm/RCMTLCPage.tsx`
  - `src/pages/rcm/RCMITGCPage.tsx`
  - `src/pages/rcm/RCMELCPage.tsx`
- **Frontend Components**:
  - `src/components/rcm/RCMPageHeader.tsx` (menambahkan tombol Export Excel opsional / actions)
  - `src/lib/rcm-excel-export.ts` (utility baru untuk parsing data matriks ke file xlsx)
- **Backend Routes**:
  - `worker/routes/rcm.ts` (penyempurnaan join query relasi parent-child BPM pada endpoint `/rcm-matrix/tlc`)
- **Localization**:
  - `src/i18n/locales/id/rcm.json` & `src/i18n/locales/en/rcm.json`
