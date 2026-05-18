## Why

Penerapan Degree of Deficiency (DoD) saat ini memiliki "mata rantai yang terputus" di mana temuan CSA yang dinilai **Ineffective** hanya tersimpan di tabel defisiensi tanpa otomatis membuat **Action Plan**, sehingga tidak muncul di papan Kanban. Selain itu, temuan yang berasal dari **Lini 2 (Review CSA/TOD)** dan **Lini 3 (Audit)** belum terintegrasi secara otomatis. Sistem juga memerlukan standarisasi status Kanban agar selaras dengan blueprint **WorkflowPanel** formal dan proteksi data melalui **Unsaved Changes Warning**.

## What Changes

- **Otomatisasi Defisiensi Multi-Lini**: Integrasi pembuatan `action_plans` secara otomatis dari Lini 1 (CSA), Lini 2 (Review), dan Lini 3 (Audit).
- **Metadata Sumber (Source Tracking)**: Penambahan atribut `source` pada defisiensi untuk membedakan asal temuan.
- **Penyelarasan Status Kanban**: Mengubah kolom `DeficiencyBoard` agar sesuai dengan tahapan formal `WorkflowPanel`.
- **Integrasi Workflow**: Menggantikan tombol aksi manual di Kanban dengan pemanggilan rute `/api/actionplans/:id/workflow`.
- **Proteksi Data**: Implementasi `UnSavedChanges` warning pada `RemediationForm` dan integrasi di seluruh modul terkait.
- **Grouping & Filtering**: Penambahan visual badge dan filter sumber pada Deficiency Board.
- **Backend Integrity**: Refactoring logika pembuatan defisiensi menjadi terpusat (DRY) untuk menangani berbagai pintu masuk data.


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
