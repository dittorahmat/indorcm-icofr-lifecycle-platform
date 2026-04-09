# Tasks: Jira-like Multi-Tier Approval Workflow for Scoping

## 1. Foundation & API
- [x] 1.1 Update `shared/types.ts`: Tambahkan role `CFO`, tipe `SimulationStatus` baru, dan interface `ApprovalHistoryEntry`.
- [x] 1.2 Update `shared/types.ts`: Tambahkan field `history` ke `MaterialitySimulation`.
- [x] 1.3 Update `worker/user-routes.ts`: Refactor endpoint `/submit`, `/approve`, dan `/reject` untuk mendukung alur bertingkat dan pencatatan history.
- [x] 1.4 Update `worker/user-routes.ts`: Pastikan inisialisasi history kosong saat membuat simulasi baru.

## 2. UI Components
- [x] 2.1 Create `src/components/scoping/ApprovalHistoryTimeline.tsx`: Komponen untuk menampilkan log aktivitas simulasi.
- [x] 2.2 Update `ScopingPage.tsx`: Integrasikan timeline history di bagian bawah worksheet.
- [x] 2.3 Update `ScopingPage.tsx`: Sesuaikan logika tombol submit dan label status.

## 3. Reviewer Portal
- [x] 3.1 Update `ApprovalPage.tsx`: Filter list simulasi berdasarkan role (CFO vs Komisaris).
- [x] 3.2 Update `ApprovalPage.tsx`: Tambahkan input `note` pada dialog approve/reject dan validasi minimal karakter jika reject.
- [x] 3.3 Update `LoginPage.tsx`: Tambahkan kredensial helper untuk role `CFO`.

## 4. Notifications & UX
- [x] 4.1 Update `src/components/app-sidebar.tsx`: Implementasi *badge* notifikasi angka merah pada menu "Materiality Approval".
- [x] 4.2 Verifikasi: Tes alur lengkap dari Line 2 -> CFO (Reject) -> Line 2 (Fix) -> CFO (Approve) -> Komut (Approve).
