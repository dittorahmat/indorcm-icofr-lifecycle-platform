# Tasks: Jira-like Multi-Tier Approval Workflow for Scoping

## 1. Foundation & API
- [x] 1.1 Update `shared/types.ts`: Tambahkan role `CFO`, tipe `SimulationStatus` baru, dan interface `ApprovalHistoryEntry`.
- [x] 1.2 Update `shared/types.ts`: Tambahkan field `history` ke `MaterialitySimulation`.
- [x] 1.3 Update `worker/db/schema.ts`: Tambahkan kolom `history` (jsonb) pada tabel `simulations`.
- [x] 1.4 Update `worker/user-routes.ts`: Implementasi endpoint `/approve` dan `/reject` serta refactor `/submit` untuk pencatatan history.
- [x] 1.5 Generate dan run Drizzle migration untuk sinkronisasi schema database.
- [x] 1.6 Update `worker/user-routes.ts`: Pastikan inisialisasi history kosong saat membuat simulasi baru.

## 2. UI Components
- [x] 2.1 Create `src/components/scoping/ApprovalHistoryTimeline.tsx`: Komponen untuk menampilkan log aktivitas simulasi.
- [x] 2.2 Update `ScopingPage.tsx`: Integrasikan timeline history di bagian bawah worksheet dan gunakan i18n untuk status.
- [x] 2.3 Update `ScopingPage.tsx`: Sesuaikan logika tombol submit dan label status.
- [x] 2.4 Update `src/i18n/locales/*/scoping.json`: Tambahkan terjemahan untuk alur approval dan status baru.
- [x] 2.5 Update `ApprovalPage.tsx`: Ganti teks hardcoded dengan kunci i18n.

## 3. Reviewer Portal
- [x] 3.1 Update `ApprovalPage.tsx`: Filter list simulasi berdasarkan role (CFO vs Komisaris).
- [x] 3.2 Update `ApprovalPage.tsx`: Tambahkan input `note` pada dialog approve/reject dan validasi minimal karakter jika reject.
- [x] 3.3 Update `LoginPage.tsx`: Tambahkan kredensial helper untuk role `CFO`.

## 4. Notifications & UX
- [x] 4.1 Update `src/components/app-sidebar.tsx`: Implementasi *badge* notifikasi angka merah pada menu "Materiality Approval".
- [x] 4.2 Verifikasi: Tes alur lengkap dari Line 2 -> CFO (Reject) -> Line 2 (Fix) -> CFO (Approve) -> Komut (Approve).
- [x] 4.3 Verifikasi: Pastikan data `history` tersimpan permanen di database setelah aksi Approve/Reject.
