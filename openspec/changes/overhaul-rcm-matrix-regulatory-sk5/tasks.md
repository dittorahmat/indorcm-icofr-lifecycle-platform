## 1. Database Schema Overhaul

- [x] 1.1 Update `rcm_controls` table in `worker/db/schema.ts` with metadata columns (IPO, Assertions, Technical fields)
- [x] 1.2 Run `npx drizzle-kit generate` to create the migration file
- [x] 1.3 Apply the migration to the database (Neon/PostgreSQL)

## 2. API & Backend Logic

- [x] 2.1 Update backend query logic to handle the new hierarchical join structure
- [x] 2.2 Implement auto-sync logic in the BPM diagram save handler to upsert `rcm_controls` rows based on edges
- [x] 2.3 Create API endpoint for batch-upsert of RCM mapping metadata for inline editing

## 3. Frontend: RCM TLC Matrix

- [x] 3.1 Create `src/pages/rcm/RCMTLCPage.tsx` using a hierarchical table structure
- [x] 3.2 Implement sticky columns for Business Process, Sub-Process, and Risk information
- [x] 3.3 Build the inline editing UI for IPO and Assertion columns using `shadcn/ui`
- [x] 3.4 Connect the table to TanStack Query for real-time saving (optimistic updates)

## 4. Frontend: RCM ELC Matrix

- [x] 4.1 Create `src/pages/rcm/RCMELCPage.tsx` following the Lampiran 5 a regulatory format
- [x] 4.2 Initialize the matrix with 17 Prinsip COSO as the base rows
- [x] 4.3 Implement placeholder columns for ELC metadata (to be fully mapped later)

## 5. Localization & UI Integration

- [x] 5.1 Add all technical regulatory terms to `src/i18n/` (id.json and en.json)
- [x] 5.2 Update `Sidebar.tsx` navigation to reflect the new process-based RCM menus
- [x] 5.3 Verify the end-to-end sync between BPM Diagramming and RCM Matrix data
