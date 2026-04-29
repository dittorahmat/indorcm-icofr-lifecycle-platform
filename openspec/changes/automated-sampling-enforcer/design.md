## Context

The current testing workflow in IndoGRC Pro relies on manual compliance with Regulation SK-5/DKU.MBU/11/2024. While the UI provides a visual suggestion for sample sizes, it does not enforce the regulatory minimums or mandate justifications for deviations. This gap leads to potential audit non-conformity.

## Goals / Non-Goals

**Goals:**
- Enforce mandatory sample size minimums based on Table 22 logic.
- Mandate "Homogeneity Justification" whenever a sample size is below the recommended minimum.
- Implement the `UnSavedChanges` guard in the Test Workbench to prevent loss of long-form documentation.
- Update Drizzle schema to ensure data persistence for new mandatory fields.

**Non-Goals:**
- Automated population extraction (remains a manual count for now).
- Historical data correction for tests performed before this enforcer (logic applies only to new submissions).

## Decisions

### 1. React Hook Form Integration for Conditional Validation
- **Decision**: Use `zod`'s `superRefine` or `refine` to implement conditional validation on the `sampleSize` and `homogeneityJustification` fields.
- **Rationale**: This allows for dynamic error messages and "Hard Block" submission behavior based on the specific control's frequency and risk rating.
- **Alternative**: Manual validation in the `onSubmit` handler. Rejected because it's less declarative and harder to integrate with the existing `FormField` components.

### 2. "Soft Block" via Justification
- **Decision**: Allow sample sizes below the minimum ONLY if a justification is provided.
- **Rationale**: Regulation SK-5 allows for professional judgement in cases of non-homogenous or small populations, but it MUST be documented. A "Hard Block" without a justification bypass would be too restrictive for real-world scenarios.

### 3. Localization Strategy
- **Decision**: Use `@src/i18n` with specific keys for regulatory warnings (e.g., `testing.errors.belowMinJustificationRequired`).
- **Rationale**: Ensures compliance across both Indonesian and English versions of the platform.

### 4. Drizzle Migration for Schema Integrity
- **Decision**: Run a dedicated migration to ensure all required fields in `TestRecord` and `CSARecord` are present and correctly typed (e.g., `homogeneityJustification`).

## Risks / Trade-offs

- **[Risk] User Friction** → **Mitigation**: Use clear, real-time visual indicators (badges/colors) so users aren't surprised by validation errors at the end of a long form.
- **[Risk] Schema Inconsistency** → **Mitigation**: Run `npx drizzle-kit generate` and `migrate` during the implementation phase to sync the Cloudflare D1 local database.
