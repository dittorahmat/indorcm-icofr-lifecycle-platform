## Why

Penerapan Degree of Deficiency (DoD) saat ini memiliki "mata rantai yang terputus" di mana temuan CSA yang dinilai **Ineffective** hanya tersimpan di tabel defisiensi tanpa otomatis membuat **Action Plan**, sehingga tidak muncul di papan Kanban. Selain itu, status Kanban saat ini belum selaras dengan blueprint **WorkflowPanel** formal (Ineffective -> In Review -> In Approval -> Resolved) dan kurangnya proteksi data melalui **Unsaved Changes Warning** pada form-form kritikal.

## What Changes

- **Otomatisasi Defisiensi**: Integrasi pembuatan `action_plans` secara otomatis saat sign-off CSA dengan hasil `Ineffective`.
- **Penyelarasan Status Kanban**: Mengubah kolom `DeficiencyBoard` agar sesuai dengan tahapan formal `WorkflowPanel`.
- **Integrasi Workflow**: Menggantikan tombol aksi manual di Kanban dengan pemanggilan rute `/api/actionplans/:id/workflow`.
- **Proteksi Data**: Implementasi `UnSavedChanges` warning pada `RemediationForm` dan integrasi di seluruh modul terkait.
- **Backend Integrity**: Penanganan rute `PUT /api/csa/:id` agar tetap memicu pembuatan defisiensi jika status berubah menjadi Ineffective.
- **Notification System**: Penambahan notifikasi bell untuk memberi tahu Lini 2/Admin saat ada temuan baru.

## Capabilities

### New Capabilities
- `remediation-workflow-sync`: Menyelaraskan status visual Kanban dengan state machine formal.

### Modified Capabilities
- `remediation-tracking`: Penambahan requirement pembuatan Action Plan otomatis dari hasil CSA.
- `csa-management`: Sinkronisasi status akhir CSA dengan modul remediasi.
- `unsaved-changes-guard`: Perluasan penggunaan guard pada form remediasi dan dashboard.

## Impact

- **Backend**: `worker/routes/csa.ts` (Auto-deficiency logic), `worker/routes/remediation.ts` (Workflow handling).
- **Frontend**: `src/pages/deficiencies/DeficiencyBoard.tsx`, `src/components/deficiencies/RemediationForm.tsx`, `src/components/workflow/WorkflowPanel.tsx`.
- **Database**: Skema `action_plans` (workflow history & status).
- **Localization**: Penambahan key baru untuk status workflow remediasi di `src/i18n/locales/`.
