## Context

The IndoGRC Pro platform currently lacks a centralized management system for standardized risks as defined in Regulation SK-5/2024. While a `RiskLibraryLookup` component exists, it is not integrated into any workflow, and there are no backend endpoints or database tables to support a persistent risk library. This results in manual data entry by users, leading to inconsistency across the Risk Control Matrix (RCM).

## Goals / Non-Goals

**Goals:**
- Implement a centralized `risk_library` table in PostgreSQL.
- Create a complete CRUD interface for managing standardized risks.
- Integrate the risk library into the `ControlEditor` to standardize risk identification.
- Automate database schema updates using Drizzle migrations.
- Provide full localization (ID/EN) for the new management interface.

**Non-Goals:**
- Implementing a bulk import feature for risks from external spreadsheets (standardized risks will be seeded or added manually via UI for now).
- Automated AI-based risk generation or suggestions beyond the library lookup.

## Decisions

### 1. Database Schema
**Decision:** Create a new `risk_library` table in `worker/db/schema.ts`.
**Rationale:** Standardized risks are reference data that need to be persisted and shared across the organization.
**Columns:**
- `id`: primary key (UUID)
- `organization_id`: for multi-tenancy
- `cluster`: enum of 11 BUMN clusters
- `risk_description`: text
- `suggested_assertions`: jsonb (array of strings)

### 2. Backend API
**Decision:** Implement standard RESTful endpoints in `worker/user-routes.ts`.
**Rationale:** Consistency with existing patterns for `controls` and `rcms`.
**Endpoints:**
- `GET /api/risklibrary`: list risks (with cluster filtering)
- `POST /api/risklibrary`: create new risk
- `PUT /api/risklibrary/:id`: update risk
- `DELETE /api/risklibrary/:id`: delete risk

### 3. Frontend Management UI
**Decision:** Create `src/pages/rcm/RiskLibraryPage.tsx` using `DataTable` and `Sheet` (Side Panel) for editing.
**Rationale:** Matches the existing UX pattern used in the RCM Manager and Deficiency modules.

### 4. Workflow Integration
**Decision:** Add the `RiskLibraryLookup` component as a trigger within the `ControlEditor` form.
**Rationale:** Provides immediate value by allowing users to pull standardized descriptions directly into their RCM entries.

## Risks / Trade-offs

- **[Risk] Database Migration Failure** → **[Mitigation]** Run `bun drizzle-kit generate` and verify the SQL output before applying to the database. Use `bun drizzle-kit up` for local validation.
- **[Risk] UI Complexity in ControlEditor** → **[Mitigation]** Keep the lookup as a non-intrusive "Lookup" button next to the risk description field, rather than forcing a selection.
- **[Risk] Data Duplication** → **[Mitigation]** Use the `organization_id` to ensure that standardized libraries can be customized per entity if needed in the future, while keeping the default seed data available.
