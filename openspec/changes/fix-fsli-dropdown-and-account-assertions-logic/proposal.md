## Why

Following the backend worker route refactoring, the FSLI (Financial Statement Line Item) dropdown in the BPM (Business Process Mapping) page is displaying incorrect or incomplete data. Additionally, the Account Assertion API lacks proper filtering, leading to data synchronization issues between the frontend and backend. This change is critical to ensure that users can accurately map business processes to the correct "In Scope" FSLIs as defined in the Scoping stage, maintaining regulatory compliance and data integrity.

## What Changes

- **Backend (Worker)**:
  - Enhance `GET /api/account-assertions` to support filtering by `fsliName` and `noGL`.
  - Fix `POST /api/account-assertions` to handle upserts correctly, aligning with frontend expectations.
  - Add a dedicated scoping utility/endpoint to retrieve "In Scope" FSLIs from the latest simulation (Draft or Approved) to ensure BPM continuity.
- **Frontend**:
  - Update `BPMPage.tsx` to fetch FSLIs from the correct scoping data source, moving away from restrictive "Approved Only" filters when appropriate.
  - **Sorting Logic**: Implement hierarchical sorting for the FSLI dropdown in `BPMPage.tsx` based on `noUrut`, consistent with the `ScopingPage` sorting logic.
  - Implement the **Unsaved Changes Guard** pattern in the Account Assertion section to prevent data loss.
  - Add localization for new and updated UI elements in `src/i18n/`.
  - Add a **Notification Bell** to the sidebar for real-time alerts (e.g., scoping updates, assertion sync status).
- **Database**:
  - Run Drizzle migrations to ensure schema consistency (using `npx drizzle-kit push`).
- **Standardization**:
  - Apply Clean Code, SOLID, DRY, KISS, and YAGNI principles.
  - Run full type check, linting, and build verification.

## Capabilities

### New Capabilities
- `fsli-bpm-synchronization`: Logic to ensure FSLIs in BPM page strictly follow the "In Scope" results from the latest Scoping simulation.
- `account-assertion-filtering`: API capability to query specific GL account assertions with high precision.

### Modified Capabilities
- `unsaved-changes-guard`: Integrate the existing guard pattern into the BPM/Assertion workflow.
- `compliance-notification-system`: Extend the system to include real-time alerts via a sidebar Notification Bell.

## Impact

- **APIs**: `GET /api/account-assertions`, `POST /api/account-assertions`.
- **Pages**: `src/pages/bpm/BPMPage.tsx`.
- **Components**: Sidebar navigation, new `NotificationBell` component.
- **Worker**: `worker/user-routes.ts`, `worker/routes/scoping.ts`.
- **Types**: `shared/types.ts`.
- **DB**: Drizzle schema and migrations.
