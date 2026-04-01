## Context

The system currently uses "Pass" and "Fail" for TOD and TOE results. While common in general auditing, Regulation SK-5/2024 requires conclusions to be "Efektif" (Effective) and "Tidak Efektif" (Ineffective). We need to migrate the data model and update the UI to match these requirements.

## Goals / Non-Goals

**Goals:**
- Update `TestRecord['result']` type to `'Effective' | 'Ineffective'`.
- Update `TestWorkbench.tsx` UI buttons and status badges.
- Ensure automated deficiency logic triggers on `'Ineffective'`.
- Provide Indonesian translations ("Efektif"/"Tidak Efektif") for regulatory report views.

**Non-Goals:**
- Changing the 5-step ICOFR process itself.
- Modifying the underlying testing methodology.

## Decisions

### 1. Data Model Migration
The `TestRecord` interface in `shared/types.ts` will be modified:
```typescript
// FROM:
result: "Pass" | "Fail";
// TO:
result: "Effective" | "Ineffective";
```
*Rationale*: Using English enum values maintains codebase consistency while being semantically accurate.

### 2. UI Mapping Helper
We will implement a central mapping helper in `lib/compliance-utils.ts` to handle local/regulatory naming:
```typescript
const TEST_RESULT_MAP = {
  Effective: { label: "Efektif", variant: "success", color: "text-green-600" },
  Ineffective: { label: "Tidak Efektif", variant: "destructive", color: "text-red-600" }
};
```

### 3. Component Updates
- **TestWorkbench.tsx**: 
  - Change Button labels: `Fail TOD` -> `Not Effective`, `Pass TOD` -> `Effective`.
  - Update `onSubmit` handlers to use new enum values.
- **DeficiencyBoard.tsx**: 
  - Update any logic filtering for "Fail" to "Ineffective".
- **RegulatoryAppendices.tsx**:
  - Ensure results are displayed as "Efektif" or "Tidak Efektif".

## Risks / Trade-offs

- **Risk**: Existing data stored in `localStorage` or local DB will break if not migrated.
  - **Mitigation**: Add a small migration check in `main.tsx` or handle "Pass/Fail" as legacy values in the UI mapping.
- **Risk**: User confusion if they are used to audit-standard "Pass/Fail".
  - **Mitigation**: Use Tooltips to explain that this terminology matches SK-5/2024.
