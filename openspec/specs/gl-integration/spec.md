# Spec: GL Data Integration

## Purpose
Enable users to populate the ICOFR Scoping Matrix with real General Ledger data through manual CSV upload and provide a visual mockup for automated ERP synchronization.

## Requirements
1.  **Manual GL Upload:**
    -   Must support `.csv` files.
    -   Must extract account names and ending balances.
    -   Must automatically mark accounts as `Significant` if `balance >= PM`.
    -   Must append newly uploaded accounts to the existing scoping matrix.

2.  **ERP Sync Mockup (ETL):**
    -   Must allow selection from at least 4 common ERP providers (SAP, Oracle, Odoo, MS Dynamics).
    -   Must allow selection of synchronization frequency: Daily, Weekly, Monthly.
    -   Must provide a "Sync Now" action that simulates a successful data transfer.
    -   Must display a relative timestamp for the last successful synchronization.

## UI/UX Standards
-   Use **Shadcn UI** components (`Button`, `Card`, `Dialog`, `Select`, `RadioGroup`).
-   Include an "Upload Progress" or "Processing" state during file parsing.
-   Provide clear visual feedback (Toast) upon successful data import.
-   Adhere to the blue/indigo color scheme established in `ScopingPage.tsx`.

## Logic Rules
-   `PM (Performance Materiality)` must be defined before GL upload is processed.
-   `Quantitative Significance` flag is read-only for uploaded records based on the threshold.
-   Qualitative reasons can still be added to any account after upload.
