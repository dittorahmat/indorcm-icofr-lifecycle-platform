## Why

In ICOFR (Internal Control over Financial Reporting) scoping compliant with BUMN Regulation SK-5/DKU.MBU/11/2024 and international auditing standards (ISA 320, PCAOB AS 2105/AS 2201), establishing Overall Materiality (OM), Performance Materiality (PM), and Haircut percentages requires explicit, defensible professional judgment.

Currently, scoping simulations in IndoGRC lack structured documentation explaining why a specific benchmark was selected and why particular OM/Haircut percentages were set. Capturing this merely as unstructured free text results in vague, unstandardized notes that fail internal and external audit scrutiny (BPK, BPKP, KAP). By introducing a structured 4-factor risk justification alongside an auto-generated narrative memo and making it a prerequisite before locking/freezing scoping, IndoGRC ensures audit-readiness and full regulatory compliance.

## What Changes

- **Structured 4-Factor Assessment**: Introduce a standardized evaluation model capturing:
  1. *Entity Characteristics & Benchmark Focus* (e.g., Profit-Oriented, Asset-Intensive, Revenue-Driven, Volatile/Break-even).
  2. *Internal Control Maturity & Prior ICOFR Findings* (e.g., Effective/Strong, Moderate, Deficiencies Identified).
  3. *Audit Adjustment History* (e.g., Low/Clean, Moderate, Significant).
  4. *Business & Accounting IT System Stability* (e.g., Stable, Major ERP/Process Transformation).
- **Auto-Generated Narrative & Free-Text Governance Memo**: Automatically assemble a defensible rationale paragraph from the 4 factors while providing a supplementary notes field for Audit Committee minutes/decrees (Risalah Rapat Komite Audit).
- **Materiality Justification Modal / Section in Scoping Editor**: Integrate the justification interface seamlessly within the Scoping Editor where benchmark, OM %, and haircut % meet.
- **Mandatory Validation Prerequisite for Scoping Lock**: Prevent locking, freezing, or formal submission of a scoping simulation until the 4-factor justification is completed.
- **Audit Defense & Regulatory Reporting Sync**: Surface the justification in audit trails, scoping summary printouts, and Management Assessment reports (Lampiran 11 SK-5).

## Capabilities

### New Capabilities
- `scoping/materiality-justification`: Structured justification framework for OM, PM, and Haircut parameters, auto-narrative generation, and scoping lock validation prerequisite.

### Modified Capabilities
<!-- None: No existing spec under openspec/specs/ directly specifies scoping materiality justification requirements. -->

## Impact

- **UI / Frontend**:
  - `src/pages/scoping/components/MaterialityParamsCard.tsx`: Add button/status badge indicating justification completeness.
  - New component `MaterialityJustificationModal.tsx` (or drawer) for capturing the 4 factors, auto-narrative preview, and audit committee notes.
  - `src/pages/scoping/components/ScopingEditorHeader.tsx` & lock workflow: Add validation rule checking justification completion before allowing simulation lock/freeze.
- **Data Model / Types**:
  - Update `MaterialitySimulation` in `shared/types.ts` to persist `materialityJustification` (structured factors + final narrative + reference doc notes).
  - Update backend schema in `worker/db/schema.ts` (if persisted in database) or simulation storage.
- **Localization**:
  - Add bilingual i18n keys (id / en) in `src/i18n/locales/` for factor questions, options, auto-narrative templates, and validation alerts.
