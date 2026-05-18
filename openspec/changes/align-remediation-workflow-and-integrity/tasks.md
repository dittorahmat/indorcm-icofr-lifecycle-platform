## 1. Backend: Integrasi & Integritas Data (DRY)

- [x] 1.1 Update skema `deficiencies` dengan kolom `source` (Lini 1, Lini 2, Lini 3).
- [x] 1.2 Jalankan `npx drizzle-kit push` untuk migrasi kolom baru.
- [x] 1.3 Refactor `worker/routes/csa.ts` (POST & PUT) untuk menggunakan centralized deficiency builder dengan tag source.
- [x] 1.4 Refactor `worker/routes/rcm.ts` (Verification Design) untuk otomatis memicu defisiensi jika TOD Ineffective.
- [x] 1.5 Pastikan setiap pembuatan defisiensi baru otomatis membuat `action_plans` dengan `workflowStatus: "Ineffective"`.

## 2. Frontend: Penyelarasan Board & Filtering

- [x] 2.1 Update `KANBAN_COLUMNS` di `DeficiencyBoard.tsx` menjadi: `["Ineffective", "In Review", "In Approval", "Resolved"]`.
- [x] 2.2 Refactor `KanbanColumn` di `DeficiencyBoard.tsx` untuk menggunakan label status baru.
- [x] 2.3 Tambahkan visual Badge pada `DeficiencyCard` untuk menampilkan asal temuan (Lini 1/2/3).
- [x] 2.4 Implementasikan Filter Source di atas `DeficiencyBoard` untuk memisahkan tampilan temuan.
- [x] 2.5 Ganti tombol aksi manual di kartu Kanban dengan logic transisi dari `WorkflowPanel`.

## 3. Data Integrity & Proteksi (Unsaved Changes)

- [x] 3.1 Integrasikan `useUnsavedChanges` hook pada `src/components/deficiencies/RemediationForm.tsx`.
- [x] 3.2 Tambahkan props `isDirty` ke `WorkflowPanel` pada form remediasi agar sinkron dengan state guard.
- [x] 3.3 Tambahkan Notification Bell di Sidebar yang memantau penambahan temuan baru dari Lini 2/3.

## 4. Lokalisasi & Polishing

- [x] 4.1 Tambahkan key lokalisasi untuk status workflow baru di `src/i18n/locales/en/deficiency.json` dan `src/i18n/locales/id/deficiency.json`.
- [x] 4.2 Tambahkan key lokalisasi untuk label source (Lini 1 - CSA, Lini 2 - TOD, Lini 3 - Audit).
- [x] 4.3 Refactor code smell (missing imports, unused variables) di file yang dimodifikasi.

## 5. Validasi & Finalisasi

- [x] 5.1 Jalankan `npm run type-check` dan perbaiki semua error.
- [x] 5.2 Jalankan `npm test` dan buat test case baru untuk integrasi multi-source.
- [x] 5.3 Jalankan `npm run lint` dan perbaiki semua peringatan.
- [x] 5.4 Jalankan `npm run build` untuk memastikan integritas kompilasi.

