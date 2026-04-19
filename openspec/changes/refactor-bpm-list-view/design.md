# Design: BPM List View Refactor

## 1. Data Model Changes

### 1.1 `shared/types.ts`
Update `BPMProcess` and `Control` interfaces:
```typescript
export interface BPMProcess {
  id: string;
  name: string;
  noGL: string;
  fsliName: string;
  createdBy: string;
  createdAt: number;
  // New summary fields (calculated at backend)
  riskCount?: number;
  controlCount?: number;
}

export interface Control {
  // ... existing fields
  bpmProcessId?: string; // Explicit link to BPM header
}
```

### 1.2 `worker/db/schema.ts`
Add `bpmProcessId` to the `controls` table definition to allow explicit linking and efficient aggregation.

## 2. Backend Implementation

### 2.1 API: `GET /api/bpm-processes`
Refactor the handler in `worker/user-routes.ts` to use a SQL aggregation query:
- **Join**: `bpm_processes` LEFT JOIN `controls` ON `bpm_processes.id = controls.bpm_process_id`.
- **Aggregation**:
  - `controlCount`: `COUNT(controls.id)`.
  - `riskCount`: `COUNT(controls.id) FILTER (WHERE controls.is_fraud_related = true)` (or similar logic based on worksheet columns).
- **Filtering**: Maintain `noGL` filter if provided.

### 2.2 API: `POST /api/controls`
Ensure the `bpmProcessId` from the request body is saved into the database.

## 3. Frontend Implementation

### 3.1 `src/pages/bpm/BPMPage.tsx`
- **Search Logic**: Implement a local filter using `useMemo` that checks `searchTerm` against `bpm.name`.
- **Layout**:
  - Replace the flex-wrap card container with a `<Table>` component.
  - Header: Search Bar (left/center) and "Create BPM" button (right).
  - Columns:
    - **Aksi**: Icon button to open `BPMModal`.
    - **Sub Proses**: Display `bpm.name`.
    - **Perusahaan**: Lookup from `selectedGLRow.entityCode` or hardcoded.
    - **Lokasi**: Display `selectedGLRow.entityCode`.
    - **Risks**: Display `bpm.riskCount`.
    - **Controls**: Display `bpm.controlCount`.

### 3.2 `src/components/bpm/BPMWorksheet.tsx`
Ensure that when a new row is added, it correctly sends the `bpmProcessId` (already doing this, but verify implementation).

## 4. Visual Layout (Sketch)
```text
[ Search Process... ] [ + Create BPM ]
--------------------------------------
| Act | Sub Process | Company | Loc | Risk | Ctrl |
| [>] | Procurement | PT BUMN | 01  | 5    | 12   |
| [>] | Inventory   | PT BUMN | 01  | 2    | 8    |
```
