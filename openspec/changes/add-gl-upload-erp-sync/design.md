# Design: GL Upload & ERP Sync Integration

## UI/UX
-   **Scoping Tab Additions:**
    -   **Toolbar:** Add an "Upload GL" button next to the "Add Qualitative Account" button.
    -   **Dialog:** A Modal with:
        -   File Dropzone.
        -   Mapping helper (to ensure CSV columns like `Account`, `Balance` are correctly identified).
    -   **Integration Card:** A new card at the bottom of the Scoping tab for "ERP Data Synchronization".

-   **ERP Sync Configuration Mockup:**
    -   Card with:
        -   `Select` for ERP Provider (SAP, Oracle, Odoo, Dynamics).
        -   `RadioGroup` for Schedule:
            -   Daily (ETL runs every night).
            -   Weekly (ETL runs every Sunday at 00:00).
            -   Monthly (ETL runs on the 1st of each month).
        -   `Status Indicator`: A badge showing "Last Sync: [Date/Time]" and "Status: Active".
        -   `Sync Now`: Button with a loading spinner that updates the "Last Sync" time.

## Data Flow
-   **CSV Parsing:** Use the existing `worker/csv.ts` or handle it in the browser for faster feedback.
-   **Auto-Scoping Logic:**
    ```typescript
    const isSignificant = accountBalance >= performanceMateriality;
    ```
-   **State Management:** The uploaded data will populate the `localAccounts` state in `ScopingPage.tsx`.

## Data Model Updates
-   **Scoping:** No changes needed to `SignificantAccount` as it already has `name`, `balance`, and `isQuantitative`.
-   **New Mock State (Local or in DB):**
    ```typescript
    interface ERPSyncConfig {
      provider: string;
      schedule: 'Daily' | 'Weekly' | 'Monthly';
      lastSync?: number;
      status: 'Active' | 'Inactive';
    }
    ```
