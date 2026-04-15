## Context

Saat ini halaman BPM menggunakan logika kalkulasi dinamis untuk menentukan signifikansi FSLI (`significantFsliNames`). Logika ini mencoba meniru kriteria Scoping (Kuantitatif >= PM dan Kualitatif 'High'), namun memiliki kelemahan:
- Ada bypass untuk Admin/L2 yang menampilkan seluruh FSLI jika scoping belum selesai.
- Tidak sinkron dengan daftar `significantAccounts` yang sebenarnya disimpan di database setelah proses Scoping manual.
- Interface `MaterialitySimulation` di TypeScript belum memiliki properti `significantAccounts`, meskipun data tersebut dikirimkan oleh API.

## Goals / Non-Goals

**Goals:**
- Menghapus redundansi kalkulasi signifikansi di halaman BPM.
- Mengunci daftar FSLI di BPM agar hanya menampilkan hasil yang sudah disetujui di tahap Scoping.
- Memperbaiki tipe data shared untuk mendukung pengembangan fitur selanjutnya yang bergantung pada `significantAccounts`.

**Non-Goals:**
- Mengubah logika perhitungan PM/OM di modul Scoping.
- Mengubah cara penyimpanan data di database/backend.
- Menambahkan fitur baru di luar pemfilteran dropdown FSLI.

## Decisions

- **Decision 1: Gunakan `activeSim.significantAccounts` sebagai Source of Truth.**
  - *Rationale*: Data ini merepresentasikan hasil final dari proses Scoping. Jika sebuah akun tidak ada di sini, maka akun tersebut (dan FSLI terkait) tidak perlu dipetakan di BPM.
  - *Alternative*: Tetap menggunakan kalkulasi dinamis tapi memperbaiki kriteria. (Ditolak karena tetap ada risiko tidak sinkron jika user melakukan override manual di Scoping).

- **Decision 2: Pemetaan FSLI lewat GL Snapshot.**
  - *Rationale*: Karena `significantAccounts` hanya berisi daftar akun (GL), kita perlu mencari nama FSLI yang membawahi akun-akun tersebut dengan melakukan lookup ke `activeSnap.rows`. Ini memastikan nama FSLI yang muncul di dropdown adalah nama yang valid dari file GL aktif.

- **Decision 3: Penghapusan Role-Based Bypass.**
  - *Rationale*: Memberikan konsistensi alur kerja. Admin dan Lini 1 harus mengikuti aturan yang sama: BPM hanya untuk akun signifikan. Jika Admin ingin melihat FSLI lain, mereka harus melakukannya di modul Scoping.

## Risks / Trade-offs

- **[Risk]** → Jika proses Scoping belum dilakukan sama sekali, dropdown BPM akan kosong bagi Admin.
  - *Mitigation*: Pastikan ada pesan informatif di UI jika dropdown kosong (sudah ada logika "Select an FSLI... to begin" di kode saat ini).
- **[Trade-off]** → Perubahan tipe data `MaterialitySimulation` mungkin memicu peringatan TypeScript di tempat lain jika ada penggunaan yang tidak sesuai.
  - *Mitigation*: Lakukan pengecekan menyeluruh pada file yang mengimpor tipe tersebut (terutama `ScopingPage.tsx`).
