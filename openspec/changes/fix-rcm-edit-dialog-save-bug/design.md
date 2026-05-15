## Context

The RCM (Risk Control Matrix) management system uses a unified `RCMEditDialog` to provide a consistent auditing interface for three distinct regulatory levels: ELC (Entity Level), TLC (Transaction Level), and ITGC (IT General Controls). While the UI is unified, the underlying data models and API endpoints are heterogeneous:
- **ELC**: Updates the `controls` table directly via `PUT /api/controls/:id`.
- **TLC/ITGC**: Updates the `rcm_controls` (mapping) and `rcms` (risk) tables via `POST /api/rcm-matrix/:type/batch-update`.

The current implementation fails to save because it doesn't translate the "Unified UI Language" back to the specific "Backend Database Language" required for each context.

## Goals / Non-Goals

**Goals:**
- **Data Integrity**: Ensure 100% of the fields in the `RCMEditDialog` are correctly persisted to the database.
- **Identity Safety**: Guarantee that the correct records are targeted by including both `id` and `mappingId`.
- **Backend Alignment**: Fix the mismatch between frontend property names and backend column names.
- **Support Multi-Table Updates**: Ensure risk-related fields in TLC/ITGC are saved alongside control-related fields.

**Non-Goals:**
- Overhauling the `RCMTable` visualization.
- Changing the database schema (we will adapt the code to the existing schema).
- Implementing new frontend validation rules.

## Decisions

### 1. Payload Transformation Strategy (Reverse Mapping)
- **Decision**: Implement a `transformRCMValues` helper or handle transformation inside the `onSave` callback of each page.
- **Rationale**: The `RCMEditDialog` should remain "dumb" and standardized (UI-centric). Each page knows its specific backend requirements and should be responsible for translating the dialog's output into the correct API payload.
- **Alternative**: Passing a `mappingProfile` prop to the Dialog. *Rejected*: This increases Dialog complexity and maintenance overhead.

### 2. Form Schema Expansion
- **Decision**: Add `id: z.string().optional()` to the `formSchema` in `RCMEditDialog`.
- **Rationale**: Zod's `zodResolver` currently strips the `id` property because it's not in the schema, causing API calls to `/api/controls/undefined`. Adding it ensures it's preserved through the form lifecycle.

### 3. Backend Integrated Update for TLC/ITGC
- **Decision**: Modify the `rcm.post('/rcm-matrix/:type/batch-update', ...)` route in `worker/routes/rcm.ts` to detect and handle updates to the `rcms` table (risk data) when `riskDescription` or `riskRating` are present in the item payload.
- **Rationale**: This prevents multiple network requests and race conditions on the frontend, ensuring an atomic "Save" experience.
- **Alternative**: Making two separate API calls from the frontend. *Rejected*: Increases complexity and risk of partial saves.

### 4. Boolean to 'Y'/'N' Normalization
- **Decision**: Implement a utility to convert boolean switch values (IPO/Assertions) to the string format expected by the Drizzle schema before submission.
- **Rationale**: Ensures compatibility with the current database type (`text`) without changing the database schema.

## Risks / Trade-offs

- **[Risk] Mismatched Field Names** → Using `controlName` vs `name` can be confusing for developers.
    - *Mitigation*: Extensive comments in the transformation logic and clear documentation in `shared/types.ts`.
- **[Risk] Backend Performance** → Adding an extra update query to the batch-update endpoint.
    - *Mitigation*: The number of items in a batch update from the popup is typically 1. The performance impact is negligible.
