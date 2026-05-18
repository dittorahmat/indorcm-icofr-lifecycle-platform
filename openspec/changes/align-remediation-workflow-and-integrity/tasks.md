## 1. Backend: Integrasi CSA & Defisiensi (Atomic Link)

- [x] 1.1 Refactor `worker/routes/csa.ts` (POST /csa) untuk otomatis membuat `action_plans` jika result Ineffective.
- [x] 1.2 Refactor `worker/routes/csa.ts` (PUT /csa/:id) untuk otomatis membuat `action_plans` jika status berubah menjadi Ineffective.
- [x] 1.3 Pastikan skema `action_plans` memiliki default `workflowStatus: "Ineffective"` untuk data baru dari CSA.
- [x] 1.4 Jalankan `npx drizzle-kit push` jika ada perubahan skema database.

## 2. Frontend: Penyelarasan Board & Workflow

- [x] 2.1 Update `KANBAN_COLUMNS` di `DeficiencyBoard.tsx` menjadi: `["Ineffective", "In Review", "In Approval", "Resolved"]`.
- [x] 2.2 Refactor `KanbanColumn` di `DeficiencyBoard.tsx` untuk menggunakan label status baru.
- [x] 2.3 Implementasikan integrasi hook `useWorkflow` pada `DeficiencyBoard.tsx` untuk menangani `onStatusChange`.
- [x] 2.4 Ganti tombol aksi manual di kartu Kanban dengan logic transisi dari `WorkflowPanel`.

## 3. Data Integrity & Proteksi (Unsaved Changes)

- [x] 3.1 Integrasikan `useUnsavedChanges` hook pada `src/components/deficiencies/RemediationForm.tsx`.
- [x] 3.2 Tambahkan props `isDirty` ke `WorkflowPanel` pada form remediasi agar sinkron dengan state guard.
- [x] 3.3 Pastikan sidebar memiliki notification bell (jika belum ada) atau update logic notification counter untuk temuan Ineffective.

## 4. Lokalisasi & Polishing

- [x] 4.1 Tambahkan key lokalisasi untuk status workflow baru di `src/i18n/locales/en/deficiency.json` dan `src/i18n/locales/id/deficiency.json`.
- [x] 4.2 Tambahkan key lokalisasi untuk pesan Unsaved Changes jika diperlukan.
- [x] 4.3 Refactor code smell (missing imports, unused variables) di file yang dimodifikasi.

## 5. Validasi & Finalisasi

- [x] 5.1 Jalankan `npm run type-check` dan perbaiki semua error.
- [x] 5.2 Jalankan `npm test` dan tambahkan unit test untuk memastikan CSA Ineffective melahirkan Action Plan.
- [x] 5.3 Jalankan `npm run lint` dan perbaiki semua peringatan.
- [x] 5.4 Jalankan `npm run build` untuk memastikan integritas kompilasi.
