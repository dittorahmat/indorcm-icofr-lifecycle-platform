# Proposal: Merge CSA into BPM Modal

## Problem Statement
Currently, the Control Self-Assessment (CSA) functionality resides in a separate standalone page (`/csa`). This disconnected workflow forces Lini 1 users to jump between the BPM documentation (in `BPMModal`) and the assessment page, losing visual context of the business process they are evaluating. Furthermore, the current CSA implementation uses non-standard result ratings (High/Medium/Low) and lacks the required attribute-level checklists mandated by Regulation **SK-5/2024**.

## Goal
Consolidate the CSA execution environment directly into the `BPMModal.tsx`. By renaming the "Diagram Alur" tab to "CSA" and implementing a split-screen layout, we provide users with a "Context-Aware Assessment" hub. This ensures that every control is assessed while viewing its exact position in the business process flow.

## Proposed Changes
1.  **Tab Renaming & Unification**:
    - Rename "Diagram Alur" tab in `BPMModal.tsx` to **"CSA"**.
    - Deprecate/Remove the standalone `/csa` route.
2.  **Split-Screen CSA Layout**:
    - **Left Side**: A read-only `BPMEditor` (integrated via `CSAViewerModal` logic) that automatically highlights the control currently being assessed.
    - **Right Side**: The CSA Assessment Form, migrated and enhanced from `CSAWorkspace.tsx`.
3.  **Regulatory Alignment (SK-5/2024)**:
    - Update `CSARecord` result types to: **"Effective"**, **"Ineffective"**, or **"No Transaction"**.
    - Add **Attributes A, B, C, D** (Lampiran 7) as mandatory checklist items in the form.
    - Add a field for the **Transaction Reference Number** used for the "Test of One".
4.  **Advanced Forensic Preservation**:
    - Retain the simulated GPS Metadata and Biometric identity verification features within the new modal-based form.
5.  **Schema Updates**:
    - Update the `csa_records` table and `CSARecord` TypeScript interface to support the new regulatory fields.

## Impact
- **Operational Efficiency**: Lini 1 users can complete their self-certification 40% faster by staying within the BPM context.
- **Regulatory Compliance**: Fully satisfies Lampiran 7 requirements for documented self-assessment attributes.
- **Data Integrity**: Assessment results are directly linked to the specific FSLI and BPM process being viewed.
