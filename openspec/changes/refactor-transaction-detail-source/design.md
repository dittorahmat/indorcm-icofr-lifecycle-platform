## Context

The "Detail Transaksi" hub must provide a granular view of ERP-sourced line items to support regulatory sampling. The current reliance on Scoping GL Summary is insufficient for audit evidence.

## Goals / Non-Goals

**Goals:**
- Dedicated PostgreSQL storage for transaction line items.
- Client-side ingestion for standardized ERP snippets.
- Refactored 7-column sampling UI.
- Async notification system for long-running uploads.
- Data loss prevention via `UnSavedChanges`.

**Non-Goals:**
- Modifying Scoping GL logic.
- Real-time ERP direct database connection (ETL is out of scope).

## Decisions

### 1. New Schema: `transaction_details`
- **Fields**: `id`, `noGL`, `refNo`, `transDate`, `description`, `currency`, `dcFlag` (D/C), `amount`.
- **Relationship**: Linked to `organizationId` and `noGL`.

### 2. Notification Hub
- Create a `notifications` table to track background task success/failure.
- Add a floating bell icon in the sidebar/header with a badge count.

### 3. Standardized Ingestion UI
- Single-step modal: Upload -> Automatic processing of standardized headers.
- Supported format: `transDate`, `refNo`, `description`, `amount`, `currency`, `dcFlag`, `noGL`.
- Use standard `papaparse` for CSV and `xlsx` for Excel.

### 4. UnSavedChanges Integration
- Apply to `BPMModal` when selection state in the sampling tab is changed.

### 5. Data Lifecycle: Purge & Library
- **`transaction_uploads` table**: Tracks file ingestion (id, organizationId, uploadedBy, filename, rowCount, createdAt).
- **Purge Strategy**: User can choose to "Replace" existing data for a specific GL. This triggers a `DELETE` from `transaction_details` where `noGL = ?` before the new `INSERT`.
- **Audit Library**: A small UI tab in the upload modal showing the last 5-10 uploads for that GL.

## Risks / Trade-offs

- **[Risk] High Row Count** → **Mitigation**: Server-side filtering by `noGL` and limit of 500 rows per fetch.
- **[Risk] Migration Lock** → **Mitigation**: Use `npx drizzle-kit push` for rapid iterative development.
