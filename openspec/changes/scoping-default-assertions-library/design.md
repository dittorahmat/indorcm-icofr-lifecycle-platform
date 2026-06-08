## Context

Currently, the `assessmentData` field of a new `MaterialitySimulation` is initialized as an empty object in `worker/routes/scoping.ts` and `ScopingService`. Users must manually input all 8 qualitative pillars for every FSLI. This design introduces a library-driven approach to pre-populate these values based on the FSLI name.

## Goals / Non-Goals

**Goals:**
- Eliminate redundant manual entry for standard financial line items.
- Ensure consistent risk assessment baselines across simulations.
- Provide a scalable mechanism to update default assertions.

**Non-Goals:**
- Allowing users to edit the global library through the UI (this is a system-level reference).
- Overwriting existing simulation data (only applies to new simulations).

## Decisions

### 1. Library Implementation as a Backend Constant
The assertions library will be implemented as a TypeScript constant in a new file `worker/services/scoping-defaults.ts`.
- **Rationale**: The library data (170+ items) is static and regulatory in nature. Storing it as code ensures version control and avoids extra database joins during initialization.
- **Alternatives**: Storing in a database table. Decision: Rejected for now to keep implementation simple and fast, but the service interface will allow future DB migration.

### 2. Normalization during Lookup
FSLI names in the GL often contain leading spaces or varied casing (e.g., "  Bank" vs "Bank").
- **Decision**: Both the library keys and the lookup input will be trimmed and case-folded during comparison.

### 3. Integration Point: Backend `POST` Route
The auto-population will occur in `worker/routes/scoping.ts` when a new simulation is inserted.
- **Rationale**: Centralizing logic in the backend ensures all simulations (regardless of source) receive defaults and prevents frontend state complexity.

## Risks / Trade-offs

- **[Risk]**: Slight differences in FSLI naming across companies might bypass the library.
- **Mitigation**: Use fuzzy matching or partial name matching in future iterations; for now, strict normalization (trim + lowercase) covers most cases.
- **[Trade-off]**: Manual overrides will still be possible after initialization; the library provides the *starting state*, not a hard lock.
