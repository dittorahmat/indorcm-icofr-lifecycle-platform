## Context

The system currently uses a separate `risk_library` table for standardized risks, which is disconnected from the main BPM flow. Users find this rigid. The goal is to consolidate risk and control management into the BPM Editor's side panel using existing `rcms` and `controls` tables as the source for both searching and direct input.

## Goals / Non-Goals

**Goals:**
- Provide a unified search and creation experience for Risks and Controls in the BPM side panel.
- Capture regulatory-required metadata (Fraud indicator, Risk Rating, Key Control status) during creation.
- Clean up redundant "standardized library" code and data.
- Ensure data integrity via Drizzle migrations.

**Non-Goals:**
- Implementing a bulk import for the new RCM format.
- Changing the React Flow diagramming logic (only metadata and UI side panel change).

## Decisions

### 1. Database Schema Refactoring
- **Decision**: Add `isFraudRelated` (boolean) and `riskRating` (text: 'Low', 'Medium', 'High') to `rcms` table. 
- **Rationale**: These fields are required by SK-5/2024 for risk assessment but were previously missing or only available in the library table.
- **Alternative**: Keeping a separate `risk_metadata` table. Rejected to keep the query logic simple and flat for RCMs.

### 2. Search-or-Create UI Pattern
- **Decision**: Use a Combobox component (Radix/Shadcn) that filters from `useQuery(['rcm'])` and `useQuery(['controls'])`. If no match is found, show an "Add New" button that expands a small form.
- **Rationale**: Minimizes context switching for the user. They can search first, and if it's new, they don't have to leave the sidebar.

### 3. Cleanup Strategy
- **Decision**: Drop the `risk_library` table and delete `src/pages/rcm/RiskLibraryPage.tsx`.
- **Rationale**: Avoiding "zombie code" and ensuring that there's only one source of truth for risks (the `rcms` table).

## Risks / Trade-offs

- **[Risk] Migration Data Loss** → **Mitigation**: Since `risk_library` was recently introduced and users find it confusing, we will treat it as a "soft reset" for standardized risks. Real production data in `rcms` will be preserved and migrated with default values for new columns.
- **[Trade-off] Sidebar Complexity** → **Mitigation**: Use accordion or collapsible sections in the sidebar to prevent it from becoming too long when adding multiple risks.
