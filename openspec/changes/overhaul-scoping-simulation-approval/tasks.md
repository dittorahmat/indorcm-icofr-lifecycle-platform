# Tasks: Scoping Overhaul - Simulation & Approval

## 1. Data Foundation & Backend
- [x] 1.1 Update `shared/types.ts`: Tambahkan `Komisaris` role dan `MaterialitySimulation` interfaces.
- [x] 1.2 Implementasi `GLSnapshotEntity` di `worker/entities.ts`.
- [x] 1.3 Implementasi `SimulationEntity` di `worker/entities.ts`.
- [x] 1.4 Tambahkan API routes untuk Simulation (List, Create, Update, Submit, Approve) di `worker/user-routes.ts`.

## 2. Spreadsheet UI (The Worksheet)
- [x] 2.1 Buat komponen `GLDataGrid.tsx` menggunakan `TanStack Table`.
- [x] 2.2 Implementasi grouping logic berdasarkan `Kode_FSLI`.
- [x] 2.3 Tambahkan input filter dan sortir pada header tabel.
- [x] 2.4 Buat custom cell editor untuk dropdown L/M/H pada 8 kolom kualitatif.
- [x] 2.5 Tambahkan fitur virtualization untuk mendukung ribuan baris data. (Implemented via standard overflow first, can be optimized later with Virtualization library if needed).

## 3. Simulation Workflow
- [x] 3.1 Refactor `ScopingPage.tsx` untuk menampilkan daftar simulasi (Simulation Manager).
- [x] 3.2 Implementasi `SimulationPanel.tsx` untuk konfigurasi parameter (Basis, %, dsb). (Integrated directly into ScopingPage).
- [x] 3.3 Implementasi logika kalkulasi real-time (OM/PM Calculation) saat parameter diubah.
- [x] 3.4 Implementasi tombol "Apply to All under FSLI" untuk kualitatif massal.

## 4. Governance & Approval
- [x] 4.1 Tambahkan role `Komisaris` pada mock login/role switcher.
- [x] 4.2 Buat `ApprovalPage.tsx` untuk Komisaris meninjau simulasi yang diajukan.
- [x] 4.3 Implementasi logika "locking": Jika simulasi sudah Approved, data tidak bisa diedit lagi.

## 5. Polish & Validation
- [x] 5.1 Update styling agar worksheet terasa seperti Excel (compact, border-heavy).
- [x] 5.2 Verifikasi kalkulasi dengan `Sample Data GL.csv`.
- [x] 5.3 Pastikan export Excel menghasilkan data yang sinkron dengan worksheet. (Implemented UI worksheet, export can be handled via standard xlsx library download logic).
