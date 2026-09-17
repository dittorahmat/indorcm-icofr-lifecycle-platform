## Context

Matriks RCM (TLC, ELC, dan ITGC) merupakan view sentral dalam pengujian dan dokumentasi pengendalian internal ICOFR SK-5. Sebelumnya, tabel TLC dan ITGC menggunakan fungsi `renderGroupRow` yang menyisipkan baris pemisah `RCMGroupRow` biru setiap kali nilai `processName` berganti. Selain itu, relasi kontrol ke proses BPM pada endpoint `/api/rcm-matrix/tlc` belum sepenuhnya mengaitkan relasi parent-child yang baru (`bpm_processes.parentId` dan `level`), sehingga kolom `process_info` sebelumnya menggabungkan nama FSLI dan nomor GL bukannya murni Proses Induk.

## Goals / Non-Goals

**Goals:**
- Menjadikan tabel `RCMTLCPage` dan `RCMITGCPage` berwujud flat murni dengan menghapus fungsi pemisah `renderGroupRow`.
- Menyajikan kolom `process_info` pada RCM TLC murni berisi nama Proses Induk (Parent Process) dan kodenya, dan `sub_process` berisi nama Sub-Proses anak.
- Mengoptimalkan backend API `/api/rcm-matrix/tlc` untuk me-resolve `parentProcessName`, `parentBpmCode`, dan `subProcessName` berdasarkan relasi `parentId` pada `bpm_processes`.
- Mengimplementasikan fungsionalitas ekspor ke file Excel (.xlsx) dengan helper modular `exportRCMToExcel` dan mengintegrasikannya ke header `RCMTLCPage`, `RCMELCPage`, dan `RCMITGCPage`.

**Non-Goals:**
- Mengubah skema basis data PostgreSQL (tabel `bpm_processes` sudah memiliki `parentId` dan `level` yang cukup untuk kebutuhan hierarki).
- Mengubah alur edit kontrol pada `RCMEditDialog` di luar sinkronisasi nama field identitas.

## Decisions

### 1. Penghapusan Permanen `RCMGroupRow` pada TLC & ITGC
- **Keputusan**: Menghapus prop `renderGroupRow` pada pemanggilan `<RCMTable />` di `RCMTLCPage.tsx` dan `RCMITGCPage.tsx`.
- **Rasional**: Pengguna secara eksplisit menginginkan tabel flat tanpa interupsi baris biru. Dengan menghapus `renderGroupRow`, `<RCMTable />` secara otomatis merender setiap baris data secara datar (flat list) dengan styling zebra stripe yang bersih.
- **Alternatif**: Menyediakan toggle switch (flat vs grouped). Ditolak karena pengguna meminta penghapusan permanen.

### 2. Resolusi Data Hierarki BPM di Backend `/api/rcm-matrix/tlc`
- **Keputusan**: Pada query `worker/routes/rcm.ts`, tambahkan alias join untuk self-referencing parent:
  ```ts
  const parentProcess = aliasedTable(bpmProcesses, "parent_process");
  ```
  Query men-join `bpmProcesses` melalui `controls.bpmProcessId` (atau diagram), dan me-left join `parentProcess` melalui `bpmProcesses.parentId = parentProcess.id`.
  - Jika `parentProcess.id` ada: `parentProcessName = parentProcess.name`, `parentBpmCode = parentProcess.bpmCode`, `subProcessName = bpmProcesses.name`.
  - Jika tidak ada parent (`parentId` null / root): `parentProcessName = bpmProcesses.name`, `parentBpmCode = bpmProcesses.bpmCode`, `subProcessName = '-'`.
- **Rasional**: Data yang dikirim ke frontend sudah ter-resolve secara bersih, konsisten, dan tidak bergantung pada parsing string di frontend.

### 3. Modul Ekspor Excel Reusable (`src/lib/rcm-excel-export.ts`)
- **Keputusan**: Membuat helper `exportRCMToExcel(data, matrixType, filename)` menggunakan pustaka `xlsx` yang sudah terpasang di proyek.
  - Memetakan properti baris menjadi nama kolom bahasa Indonesia / formal regulasi (No, Proses Induk, Sub Proses, Deskripsi Risiko, Fraud, Rating Risiko, Kode Kontrol, Nama Kontrol, Deskripsi Kontrol, Dokumen Pendukung, Key Control, IPO C/A/V/RA, Asersi, Tipe, Frekuensi, Aplikasi, dsb.).
  - Mengonversi boolean/teks menjadi format siap audit ('Y' / 'N').
- **Rasional**: Menjaga kode halaman tetap kering (DRY) dan memudahkan perawatan bila ada penyesuaian format kolom di masa mendatang.

## Risks / Trade-offs

- **[Data Legacy Tanpa bpmProcessId]** → Mitigasi: Backend tetap mempertahankan fallback ke `rcms.process` dan `rcms.subProcess` jika kontrol lama belum terhubung ke tabel `bpm_processes`.
- **[Dataset Ukuran Besar saat Ekspor]** → Mitigasi: Pembuatan workbook `xlsx` dilakukan secara asinkron di browser memory menggunakan stream/JSON utility standar `xlsx.utils.json_to_sheet`.
