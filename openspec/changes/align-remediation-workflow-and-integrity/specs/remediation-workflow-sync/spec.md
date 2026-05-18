## ADDED Requirements

### Requirement: Sinkronisasi Status Kanban dengan Workflow Blueprint
Sistem SHALL menampilkan kolom pada `DeficiencyBoard` (Kanban) yang identik dengan status pada blueprint `ACTION_PLAN` di `WorkflowPanel`.

#### Scenario: Tampilan kolom Kanban baru
- **WHEN** user membuka halaman Deficiency Board
- **THEN** user melihat kolom: "Ineffective", "In Review", "In Approval", dan "Resolved"

### Requirement: Pengalihan Perpindahan Kolom ke Workflow API
Setiap perpindahan kartu defisiensi antar kolom (Drag & Drop) MUST memicu pemanggilan rute `/api/actionplans/:id/workflow` dengan aksi yang sesuai.

#### Scenario: Perpindahan kartu ke review
- **WHEN** user menarik kartu dari "Ineffective" ke "In Review"
- **THEN** sistem memicu API workflow dengan action "Submit" dan mengupdate audit history
