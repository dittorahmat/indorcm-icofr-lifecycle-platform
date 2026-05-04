## 1. Backend Logic Refactor

- [x] 1.1 Modifikasi route `PUT /api/bpm-diagrams/:id` di `worker/user-routes.ts` untuk mengumpulkan relasi Risk-Control aktif dari seluruh node diagram (Activity, Automated, Risk, Control).
- [x] 1.2 Implementasi pembersihan mapping `rcm_controls` berdasarkan relasi aktif tersebut, menggantikan logic lama yang berbasis pada `diagramId` risiko.
- [x] 1.3 Pastikan logic update summary `riskCount` dan `controlCount` pada tabel `bpm_processes` menggunakan hasil rekalkulasi relasi yang baru disimpan.

## 2. Data Repair Script

- [x] 2.1 Buat script `scripts/repair-bpm-summary.ts` menggunakan Drizzle ORM.
- [x] 2.2 Implementasi logic rekalkulasi total (audit) untuk menarik diagram terkini dan menghitung ulang jumlah risiko/kontrol unik per sub-proses.
- [x] 2.3 Tambahkan fungsi pembersihan untuk menghapus baris di `rcm_controls` yang referensi `control_id`-nya tidak ada di tabel `controls` (Ghost Mapping).

## 3. Verification & Execution

- [x] 3.1 Jalankan script reparasi pada database live (menggunakan `DATABASE_URL` dari `.dev.vars`).
- [x] 3.2 Lakukan pengujian manual dengan mengubah relasi di BPM Editor untuk memastikan angka summary berubah secara real-time saat di-save.
- [x] 3.3 Verifikasi bahwa baris "Penarikan Tunai" sekarang menampilkan angka 1 Risk dan 1 Control yang benar.
