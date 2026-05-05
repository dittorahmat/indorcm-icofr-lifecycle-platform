## Why

Regulation SK-5/DKU.MBU/11/2024 requires a clear audit trail for transaction-level testing. Currently, the "Detail Transaksi" tab incorrectly reuses the Scoping GL Summary data, which lacks the granular line-item detail required for valid sampling. This change establishes a dedicated data pipeline for ERP-sourced transaction details, ensuring compliance and accurate audit evidence using the mandatory 7-column layout.

## What Changes

- **Dedicated Transaction Storage**: Implementation of a new database table `transaction_details` for granular line-item transactions.
- **Independent Upload Workflow**: A new manual upload feature for ERP snippets (Excel/CSV), separate from the Scoping GL upload.
- **Regulatory Table Format**: Refactor the "Detail Transaksi" UI to strictly follow the 7-column layout (No_Referensi, Tanggal Transaksi, No_GL, Jenis Transaksi, Mata Uang, Debit_Credit, Nominal Transaksi).
- **Notification System**: Addition of a notification bell in the sidebar/header to alert users when background transaction processing is complete.
- **Data Integrity Gates**: Implementation of `UnSavedChanges` protection to prevent data loss during intensive manual sampling sessions.
- **Transaction Lifecycle Management**: Addition of purge/reset logic and a `transaction_uploads` audit library to manage multiple data sources and ensure data freshness.
- **Localization**: Full support for ID/EN strings in the new transactional hubs.

## Capabilities

### New Capabilities
- `transaction-detail-repository`: Ability to store, manage, and retrieve granular transaction line-items independent of the Scoping GL.
- `erp-snippet-ingestion`: Support for uploading and mapping transactional snippets from various ERP formats.
- `transaction-lifecycle-management`: Ability to track upload history, purge old data, and manage data freshness for specific GL accounts.
- `compliance-notifications`: System-wide notification service for async processing events (e.g., upload completion).

### Modified Capabilities
- `transactional-sampling-hub`: Updated to fetch data from the new repository and display it in the regulatory 7-column format.
- `control-testing-lifecycle`: Updated to reference granular transaction details as primary audit evidence in CSA records.

## Impact

- `worker/db/schema.ts`: Addition of `transaction_details` and `notifications` tables.
- `worker/user-routes.ts`: New endpoints for transaction and notification management.
- `src/components/bpm/TransactionSamplingTab.tsx`: Complete UI refactor.
- `src/i18n/`: Addition of transactional metadata strings.
- `src/components/layout/Sidebar.tsx`: Integration of notification bell.
