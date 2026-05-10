## Context

The recent refactoring of worker routes into domain-specific modules left some legacy logic in `user-routes.ts` and introduced some discrepancies between frontend expectations and backend API capabilities. Specifically, the FSLI dropdown in `BPMPage.tsx` and the Account Assertion management are suffering from data synchronization issues and overly restrictive filtering.

## Goals / Non-Goals

**Goals:**
- **Modularize Account Assertions**: Move assertion routes from `user-routes.ts` to a dedicated `worker/routes/account-assertions.ts`.
- **Precise API Filtering**: Ensure `GET /api/account-assertions` supports specific filtering by `fsliName` and `noGL`.
- **Robust Scoping Linkage**: Ensure the BPM page correctly identifies "In Scope" FSLIs from the latest valid Scoping simulation.
- **Hierarchical FSLI Order**: Sync the FSLI dropdown order with `ScopingPage` using `noUrut`.
- **Data Safety**: Implement `UnsavedChanges` guard for the assertion form.
- **Improved UX**: Add a Notification Bell for real-time compliance alerts.
- **Code Quality**: Refactor legacy logic using SOLID and Clean Code principles.

...

### 5. Hierarchical Sorting for FSLI Dropdown
**Decision**: Calculate the minimum `noUrut` for each unique FSLI using the `activeSnap.rows` data and sort the dropdown items by this value.
**Rationale**: Aligns with the regulatory sorting order required by BUMN and improves user familiarity by matching the Scoping page layout.
**Alternatives**: Alphabetical sorting (rejected as it breaks regulatory alignment).

**Non-Goals:**
- Changing the underlying database schema for Assertions (staying with `account_assertions` table).
- Overhauling the entire Scoping logic (only fixing the linkage to BPM).

## Decisions

### 1. Modularize Account Assertion Routes
**Decision**: Create `worker/routes/account-assertions.ts` and mount it in `worker/app.ts`.
**Rationale**: Aligns with the project's architectural goal of decomposing the `user-routes.ts` monolith. Improves maintainability and type safety.
**Alternatives**: Keep in `user-routes.ts` (rejected as it continues the "legacy" smell).

### 2. Enhanced Assertion API Contract
**Decision**: Update the GET endpoint to return a single item when filtered by `fsliName` and `noGL`, or a list otherwise. Update the POST endpoint to perform a single-record upsert.
**Rationale**: Simplifies frontend logic in `BPMPage.tsx` which currently has to filter the entire list in memory or handle missing backend parameters.
**Alternatives**: Move filtering logic entirely to the frontend (rejected for performance and data integrity reasons).

### 3. Dynamic Scoping Baseline in BPM
**Decision**: Update `BPMPage.tsx` to query for the latest Approved simulation, falling back to the latest Draft simulation if no Approved one exists for the current year.
**Rationale**: Allows users to start BPM mapping while scoping is still in progress (Draft), while prioritizing the official Approved baseline.
**Alternatives**: Strict "Approved Only" (rejected as it blocks workflow).

### 4. Implementation of Notification Bell
**Decision**: Create a `NotificationBell` component that polls the `/api/notifications/unread-count` endpoint every 30 seconds.
**Rationale**: Provides immediate visual feedback for regulatory alerts without the complexity of WebSockets in the current Cloudflare Workers environment.
**Alternatives**: WebSocket/Durable Objects (rejected as overkill for now).

## Risks / Trade-offs

- **[Risk]** Broken deep-links from Scoping to BPM → **[Mitigation]** Verify that `selectedFsli` and `noGL` URL params still trigger the correct state in `BPMPage`.
- **[Risk]** Data loss during transition to modular routes → **[Mitigation]** Use Drizzle's `eq` and `and` operators carefully to preserve organization-level isolation.
- **[Risk]** UI clutter in the sidebar → **[Mitigation]** Place the Notification Bell discreetly next to the user profile or in the top header.
