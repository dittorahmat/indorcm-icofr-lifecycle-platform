## Context

The current system links transactions solely via `noGL` (Account Code). This design is insufficient for processes that share the same Account but represent distinct audit scopes (sub-processes). By introducing a `bpm_process_id` linkage, we can isolate transaction data per sub-process, improving audit accuracy and preventing cross-process data leakage.

## Goals / Non-Goals

**Goals:**
- Establish a direct database relationship between transactions and business processes.
- Provide a UI for managing human-readable BPM Codes (e.g., BPM-FIN-01).
- Enable process-aware transaction filtering in the sampling and assessment tabs.
- Ensure all new UI elements are localized and support unsaved changes guards.

**Non-Goals:**
- Retroactively linking all existing transactions (historical data without BPM IDs will remain "Global" or "Uncategorized").
- Automating the categorization of transactions based on content (AI-driven classification).

## Decisions

### 1. Data Model Expansion
- **Decision**: Add `bpmProcessId` column to the `transaction_details` table.
- **Rationale**: This is the most direct way to enforce the relationship. Using a text column (pointing to process UUID) ensures compatibility with the existing DO/SQLite pattern.
- **Alternatives**: Using a join table. Rejected as transactions are usually scoped to a single process once uploaded for audit.

### 2. BPM Code Management UI
- **Decision**: Add a "BPM Code" input field in the **BPM Worksheet** header area.
- **Rationale**: This is where managers set up the process metadata (like standard procedures). It keeps the administration centralized.
- **Implementation**: Use the existing `PATCH /api/bpm-processes/:id` endpoint.

### 3. Smart Filtering Logic
- **Decision**: Update `GET /api/transaction-details` to accept an optional `bpmProcessId` query parameter.
- **Behavior**:
  - If `bpmProcessId` is provided: Return transactions matching both `noGL` AND `bpmProcessId`.
  - If NOT provided: Return transactions matching `noGL` (Legacy/Global view).

### 4. Linkage Priority (Smart Linkage)
- **Decision**: Establish clear precedence for resolving `bpmProcessId` during uploads.
- **Priority Rules**:
  1. **Explicit Column**: If the CSV contains a `bpmCode` column, the system MUST use its value for each row. An empty string in this column explicitly marks the transaction as **unlinked** (belongs to the Account/GL but not to any specific sub-process).
  2. **Implicit Context**: If the CSV **lacks** a `bpmCode` column, the system SHALL default all rows to the `bpmProcessId` provided in the upload request (the context of the modal it was uploaded from).
- **Rationale**: This allows users to perform bulk uploads for multiple processes in one file while still supporting surgical, process-specific uploads without requiring column modification.

### 5. Migration Strategy
- **Decision**: Use `npx drizzle-kit push` for immediate schema updates.
- **Rationale**: The development environment uses a direct push model to Neon/D1.

## Risks / Trade-offs

- [Risk] Data Fragmentation → If a user uploads the same CSV to two different sub-processes, data will be duplicated. Mitigation: This is actually desired for audit isolation (different samples for different tests).
- [Risk] Performance on large transaction tables → Filtering by process ID adds another index requirement. Mitigation: Ensure `bpm_process_id` is indexed in Drizzle.
