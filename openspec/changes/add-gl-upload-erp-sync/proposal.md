# Proposal: GL Upload & ERP Sync Simulation

## Business Case
The current scoping process requires manual entry of significant accounts. This is time-consuming and prone to error. To align with standard auditing practices and enhance the user experience, we need:
1.  **Manual GL Upload:** To quickly populate the scoping matrix from a CSV export.
2.  **ERP Sync Mockup:** To demonstrate future automation capabilities (ETL) and provide a platform-ready feel.

## Goals
-   Provide a CSV upload interface for General Ledger data.
-   Automatically flag accounts as "Significant" if their balance exceeds Performance Materiality (PM).
-   Include a mockup for ERP Synchronization settings with scheduling options.

## Scope
-   **Frontend:** Add upload UI and ERP Sync configuration cards to `ScopingPage.tsx`.
-   **Backend:** Add a basic mock endpoint for processing GL data if needed, or handle it client-side for the prototype.
-   **Mockup:** Include a scheduler selection (Daily, Weekly, Monthly) and ERP provider selection.

## Out of Scope
-   Actual production ETL pipeline implementation (this is a simulation/mockup for now).
-   Direct database connection to external ERPs.
