## Context

Di IndoGRC Pro, modul scoping memiliki simulasi materiality. Saat simulasi berstatus "Approved", seluruh elemen UI dimasukkan ke mode read-only (locked). Akan tetapi, status kotor halaman (`isDirty`) masih mengevaluasi perbandingan antara nilai masukan saat ini (`currentState`) dengan nilai awal dari server (`originalState`). Evaluasi ini menghasilkan nilai `true` (false-positive) karena perbedaan inisialisasi default antara frontend (yang mengubah `null` menjadi `''` atau `0`) dan database (yang mengembalikan `null`). Akibatnya, `WorkflowPanel` memblokir tombol aksi seperti Rollback atau Unlock karena mendeteksi ada perubahan data yang belum disimpan.

## Goals / Non-Goals

**Goals:**
- Mencegah timbulnya peringatan `unsaved changes` saat editor dalam mode locked (terkunci).
- Melakukan normalisasi perbandingan state di `useScopingEditor` agar nilai `null` di database dianggap sama dengan nilai kosong (`''` atau `0`) di frontend.
- Memungkinkan pengguna melakukan rollback atau unlock pada simulasi scoping tanpa hambatan.

**Non-Goals:**
- Mengubah alur kerja otorisasi persetujuan workflow (seperti siapa yang berhak menyetujui/menolak).
- Mengubah logika penyimpanan data atau skema basis data.

## Decisions

### 1. Menambahkan Short-Circuit `isDirty = false` Saat Locked
*   **Pendekatan:** Jika `simState.workflowStatus` tidak sama dengan `'Draft'` dan bukan `'Rejected'`, maka editor berada dalam mode terkunci (locked). Dalam mode ini, `isDirty` harus langsung menghasilkan `false`.
*   **Alasan:** Ketika data terkunci, input UI dinonaktifkan secara penuh sehingga pengguna tidak dapat mengedit data. Jika tidak ada data yang bisa diubah, maka secara logis tidak mungkin ada perubahan yang belum disimpan.
*   **Alternatif:** Membiarkan status `isDirty` tetap mengevaluasi state tapi mengabaikan peringatan `isDirty` di `WorkflowPanel` untuk jenis aksi tertentu. Alternatif ini kurang baik karena melanggar konsistensi `WorkflowPanel` yang bersifat generik untuk semua modul.

### 2. Normalisasi Tipe Data Saat Perbandingan
*   **Pendekatan:** Melakukan fallback `|| ''` untuk string dan `|| 0` untuk angka, serta `|| {}` untuk objek pada `currentState` dan `originalState` di dalam React.useMemo untuk `isDirty`.
*   **Alasan:** Mencegah perbandingan stringify menghasilkan nilai tidak cocok akibat data dari API bernilai `null` sedangkan state lokal diinisialisasi sebagai string kosong atau angka nol.

## Risks / Trade-offs

- **[Risiko]** Jika ada skenario di mana pengguna bisa mengedit data saat status terkunci (locked), perubahan tersebut tidak akan terdeteksi sebagai `isDirty`.
  - **Mitigasi:** Logika `isLocked` diuji secara ketat untuk memastikan semua elemen masukan dinonaktifkan jika dokumen tidak dalam status `Draft` atau `Rejected`.
