# Design: Merge CSA into BPM Modal

## Component Architecture

### 1. `BPMModal.tsx`
The primary entry point. The `Tabs` structure will be updated:
- `worksheet`: Remains unchanged (SK-5 Table view).
- `csa`: (Formerly `diagram`) New split-screen container.
- `logs`: Remains unchanged (Lampiran 6).

### 2. New Component: `CSATabContent.tsx`
A child component for the "csa" tab that manages:
- **State**: The currently selected control for assessment (defaulting to the first control in the list).
- **Layout**: `ResizablePanelGroup` (from Shadcn) to allow user adjustment between the diagram and the form.

#### Left Panel: Visual Context
Uses a read-only instance of `ReactFlow` (similar to `CSAViewerModal`) that:
- Loads the diagram associated with the current `noGL`.
- Accepts a `highlightControlId` prop to pulse/highlight the target node.

#### Right Panel: Assessment Form
A scrollable form implemented with `react-hook-form` containing:
- **Control Info**: Display name and code.
- **Result**: Radio group [Effective, Ineffective, No Transaction].
- **Attributes Checklist**:
  - [ ] A: Objective Achieved?
  - [ ] B: Process Consistency?
  - [ ] C: Authority/Competence?
  - [ ] D: Supporting Evidence valid?
- **Test of One Reference**: Input for transaction ID.
- **Evidence Upload**: Drag-and-drop zone with forensic simulation.
- **Biometric Action**: "Sign & Submit" button triggering the biometric mockup.

## Database Schema Changes (`worker/db/schema.ts`)

### `csa_records` Table Update
```typescript
export const csaRecords = pgTable("csa_records", {
  // ... existing fields ...
  result: text("result").$type<"Effective" | "Ineffective" | "No Transaction">().notNull(),
  transReference: text("trans_reference"), // New: Sample ID
  attrA: boolean("attr_a").default(false),
  attrB: boolean("attr_b").default(false),
  attrC: boolean("attr_c").default(false),
  attrD: boolean("attr_d").default(false),
  // ... forensic fields ...
});
```

## API Updates

### `POST /api/csa`
Update to handle the new regulatory fields and validation. Ensure that if result is "Ineffective", a record is automatically flagged for the Remediasi (Deficiencies) module.

### `GET /api/bpm-diagrams/by-gl/:noGL`
An endpoint to fetch the specific diagram linked to a GL account (to populate the left panel).
