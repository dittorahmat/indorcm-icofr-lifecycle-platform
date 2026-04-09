# Design: Scoping Overhaul - Simulation & Approval

## Technical Architecture

### 1. Data Snapshot Pattern
Untuk menjaga integritas data selama proses simulasi dan approval, kita akan menggunakan pola **Snapshot**.
- **`GLSnapshot` Entity:** Menyimpan salinan mentah baris-baris GL dari file CSV/Excel yang diupload.
- **`MaterialitySimulation` Entity:** Menyimpan parameter (basis, %, PM) dan referensi ke `GLSnapshot`.
- **`QualitativeAssessment` Entity:** Menyimpan nilai L/M/H untuk 8 rule per akun GL dalam konteks simulasi tertentu.

### 2. Frontend Components Overview
- **`ScopingWorksheet`**: Komponen utama berbasis `TanStack Table` v8.
  - Fitur: Grouping by `Kode_FSLI`, Filtering, Sorting.
  - Cell Editor: Custom component untuk L/M/H dropdown pada 8 kolom kualitatif.
- **`SimulationPanel`**: Form untuk input parameter simulasi (Basis, OM %, Haircut %).
- **`ApprovalWorkflow`**: Role-based UI logic.
  - Lini 2: "Submit for Approval".
  - Komisaris: "Approve" / "Reject".

## Data Model Updates (`shared/types.ts`)

```typescript
export type QualitativeLevel = "Low" | "Medium" | "High";

export interface QualitativeEntry {
  ruleId: number; // 1-8
  level: QualitativeLevel;
}

export interface MaterialitySimulation {
  id: string;
  name: string;
  year: number;
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  basis: "Revenue" | "PBT" | "Assets" | "Equity" | "Net Current Assets";
  omPercentage: number;
  haircutPercentage: number;
  omValue: number;
  pmValue: number;
  glSnapshotId: string;
  assessmentData: Record<string, QualitativeEntry[]>; // Key: No_GL
  createdBy: string;
  createdAt: number;
}
```

## Logic Highlights
- **Grouping Logic:** Saldo FSLI dihitung dengan menjumlahkan `GL_Balance` semua akun yang memiliki `Kode_FSLI` yang sama.
- **Automatic Highlighting:** Row-level logic:
  `isSignificant = (balance >= pmValue) || assessmentData[no_gl].some(e => e.level === "High")`
- **Excel Export/Import:** Mendukung parsing format titik/koma Indonesia (misal: 1.000.000,00).

## Implementation Phases
1. **Phase 1: Backend Foundation.** Tambahkan entitas baru dan update UserRole.
2. **Phase 2: Spreadsheet Component.** Implementasi TanStack Table dengan virtualization dan grouping.
3. **Phase 3: Simulation Logic.** Form parameter simulasi dan kalkulasi real-time.
4. **Phase 4: Approval Workflow.** UI khusus Komisaris dan mekanisme "locking" data yang disetujui.
