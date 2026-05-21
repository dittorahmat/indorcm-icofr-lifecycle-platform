## 1. Database & Schema Updates

- [x] 1.1 Update `controls` schema to include `isMigrated` (boolean) and `aiGuessedFields` (jsonb) fields.
- [x] 1.2 Update `gl_rows` schema to support confidence scores for FSLI mapping.
- [x] 1.3 Create a migration staging storage mechanism (e.g., `migration_sessions` table or a dedicated staging entity in Durable Objects).
- [x] 1.4 Generate and run Drizzle migrations (`npx drizzle-kit push`) to sync the database schema.

## 2. AI Normalization & Guessing Engine

- [x] 2.1 Implement "Knowledge Base Indexer" to extract patterns from `/docs` templates.
- [x] 2.2 Implement **Level 1: Master COA Auto-Classification** (Mapping corporate accounts to FSLI/Categories).
- [x] 2.3 Implement **Level 2: Local-to-Master Semantic Mapping** (Matching subsidiary accounts to Holding standards).
- [x] 2.4 Implement "Smart Header Discovery" for dynamic Excel layouts.
- [x] 2.5 Implement the AI Prompt for Enum Normalization and Regulatory Guessing (Assertions, IPO).

## 3. Core Migration Backend Logic

- [x] 3.1 Implement the Bottom-Up Reconstruction logic (automatically creating Processes/Risks from RCM rows).
- [x] 3.2 Implement the Financial-Control Cross-Check validator (TB vs RCM reconciliation).
- [x] 3.3 Implement the `MIGRATION_BASELINE` action in the `audit_logs` service.

## 4. Frontend implementation

- [x] 4.1 Scaffold the Migration Workspace route (`/rcm/migration`) and integrate it into the Sidebar menu.
- [x] 4.2 Build `FileUploadZone` component for dual ingestion (TB + RCM).
- [x] 4.3 Build the "Washing Machine" `StagingTable` with inline-editing and visual AI-guess markers.
- [x] 4.4 Wrap the Migration Workspace with the `useUnsavedChanges` hook to prevent accidental data loss during review.
- [x] 4.5 Build the `CrossCheckPanel` to visualize relationship between TB accounts and RCM controls.
- [x] 4.6 Implement the "Intelligence Dashboard" summary (The final Top-Down view of reconstructed data).
- [x] 4.7 Add the "Finalize & Set Baseline" bulk approval workflow for CFO/Line 1.
- [x] 4.8 Integrate the Notification Bell to alert users upon successful migration baselining.
- [x] 4.9 Enhance `BPMEditor.tsx` with a "Migration Backlog" sidebar panel to drag-and-drop migrated entities.
- [x] 4.10 Ensure full i18n localization for all new UI components by updating `src/i18n/locales/**/*.json`.

## 5. Verification & Compliance

- [x] 5.1 Add unit tests for the AI normalization logic with various Excel text samples (TDD approach).
- [x] 5.2 Validate the generated Audit Trail against SK-5/2024 Lampiran 6 standards.
- [x] 5.3 Verify that migrated data correctly appears in standard Scoping and RCM pages.
- [x] 5.4 Run global `type-check`, `lint`, and `build` commands to ensure zero regressions.
