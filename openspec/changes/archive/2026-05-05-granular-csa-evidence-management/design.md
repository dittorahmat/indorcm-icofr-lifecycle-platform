## Context

The current CSA assessment UI uses a "Summary Table" where samples are rows and controls are columns. This layout makes it impossible to attach unique evidence for each sample-control intersection. Regulatory standards (SK-5) require that every test point (1 sample tested against 1 control) must be documented individually.

## Goals / Non-Goals

**Goals:**
- Provide a row-by-row verification interface (Flattened Table).
- Ensure every verification point is linked to a BPM workflow risk/control.
- Enable granular evidence management (1 file/remark per test point).
- Enforce mandatory documentation for all points before sign-off.

**Non-Goals:**
- Moving from Sample-based testing to full population testing (sampling remains the core method).
- Redesigning the BPM diagram layout itself.

## Decisions

### 1. Data Schema Expansion
The `controlResults` field in `csa_samples` table (JSONB) will be expanded from a simple boolean map to a structured object:
```typescript
interface GranularControlResult {
  implemented: boolean;    // Pass/Fail status
  evidenceUrl?: string;    // Link to R2 storage
  comment?: string;        // Free-text remark
  riskId: string;          // Source Risk from BPM
  riskName: string;        // Display name
  controlName: string;     // Display name
}

type ControlResultsMap = Record<string, GranularControlResult>; // Key is controlId
```

### 2. Dual-Table UI Layout
`CSATabContent.tsx` will be refactored to show two distinct sections:
- **Section A: Summary Matrix**: Retains the current view (Rows: Samples, Columns: Controls). This is for a high-level "Pass/Fail" check. The "Evidence" column will be removed from this table.
- **Section B: Granular Evidence List**: A new table below the matrix that flattens all verification points.
  - **Rows** = `SampleCount * ControlCount`.
  - **Columns**: Transaction Detail, Record ID, Risk Name, Control Name, Evidence Upload (Button), Keterangan (Text), Defisiensi (Toggle/Checkbox).
  - **Status Logic**: Checked = **PASS** (Implemented), Unchecked = **FAIL** (Deficiency).
  - **Default State**: All points will be **UNCHECKED** (Fail) by default for new assessments to ensure proactive verification.
  - **Synchronization**: Both tables will bind to the same `controlResults` state. Checking "Pass" in the matrix will update the corresponding row in the granular list, and vice-versa.

### 3. Workflow Data Source
The system will extract `regulatoryPairs` directly from the `diagram.nodes`. This ensures the Risk and Control names displayed in the granular table are always in sync with the visual diagram.

## Risks / Trade-offs

- [Risk] Performance on very large samples. If a user selects 50 samples and has 10 controls, the table will have 500 rows. → [Mitigation] Implement virtualization if rows exceed 100, and use grouped headers to visually organize by sample.
- [Risk] Data migration for old CSA records. → [Mitigation] Implement a transformation shim that converts legacy boolean results into the new granular format on the fly for viewing older assessments.
