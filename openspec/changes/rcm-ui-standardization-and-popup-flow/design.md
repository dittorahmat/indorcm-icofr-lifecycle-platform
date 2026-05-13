## Context

The RCM (Risk Control Matrix) pages—ELC, TLC, and ITGC—are the core of the auditor's workflow. They are governed by the SK-5 regulation, which mandates 34 columns of data. The current implementation is fragmented across three separate page files with high code duplication, inconsistent typography, and a "brutalist" UI that lacks visual anchors, making horizontal navigation across 4800px extremely difficult. Inline editing also lacks safety guards against unintentional navigation.

## Goals / Non-Goals

**Goals:**
- **Standardization**: Create a unified `RCMTable` and `RCMEditDialog` to handle all three levels (ELC, TLC, ITGC).
- **Visual Hierarchy**: Implement Multi-Level Headers and Group Headers to maintain context during horizontal scrolling.
- **Typography & Consistency**: Standardize font sizes and types across all RCM interfaces.
- **Data Integrity**: Replace inline editing with a safe, sectioned Popup Form guarded by an unsaved changes mechanism.
- **Infrastructure**: Ensure any schema drift is handled via Drizzle migrations.

**Non-Goals:**
- Reducing the number of columns (34 columns are mandatory).
- Changing the primary brand colors (preserving the user-requested `#D3D3D3` zebra stripe).
- Overhauling the backend API logic (focus is on UI/UX and safety).

## Decisions

### 1. Reusable `RCMTable` Component
- **What**: A shared table component that accepts column definitions and data level (ELC/TLC/ITGC).
- **Rationale**: Currently, three pages duplicate the same `Table`, `TableHeader`, and `TableRow` logic. A single component improves maintainability and ensures that UI improvements (like borders and typography) apply everywhere simultaneously.

### 2. Multi-Level & Grouped Headers
- **What**: Use a two-row header. Top row for logical groups (e.g., "Identitas Proses", "Risiko", "Pengendalian", "Asersi"). Second row for the mandated labels.
- **Rationale**: Reduces cognitive load by allowing users to mentally chunk 34 columns into 4-5 high-level categories.

### 3. Tabbed/Sectioned Edit Dialog
- **What**: A large Dialog component triggered by the sticky pencil icon. Fields will be grouped into:
    - **General**: ID, BPM Code, FSLI.
    - **Control/Risk**: Descriptions and Ratings.
    - **Compliance**: IPO and Assertion flags (using Switches/Checkboxes).
- **Rationale**: 34 fields in a vertical form or inline grid are overwhelming. Sectioning data makes auditing more systematic.

### 4. Safety Guard Integration
- **What**: Bind the `isDirty` state of the `RCMEditDialog` form to the `useUnsavedChanges` hook.
- **Rationale**: Prevents data loss if a user accidentally clicks outside the modal or navigates away while editing a complex mapping.

## Risks / Trade-offs

- **[Risk] High Information Density** → Even with grouped headers, 4800px is wide. 
    - *Mitigation*: Ensure sticky columns for "No" and "Control ID" are robust. Implement vertical guides every 5 columns.
- **[Risk] Migration of Inline State** → Moving from inline state to Dialog state might break current save patterns.
    - *Mitigation*: Use a pilot implementation on `RCMTLCPage` before rolling out to others. Ensure `onSuccess` from TanStack Query properly closes the dialog and refreshes the grid.
- **[Risk] Localization Bloat** → 34 columns x 3 pages = many translation keys.
    - *Mitigation*: Create a specific `rcm.json` translation file to keep `common.json` clean.
