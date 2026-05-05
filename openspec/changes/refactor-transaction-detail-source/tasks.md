## 1. Backend & Data Layer

- [x] 1.1 Add `transaction_details` table to `worker/db/schema.ts` with columns: `id`, `organizationId`, `noGL`, `refNo`, `transDate`, `description`, `currency`, `dcFlag`, `amount`.
- [x] 1.2 Add `notifications` table to `worker/db/schema.ts` if missing.
- [x] 1.3 Run Drizzle migration: `npx drizzle-kit push`.
- [x] 1.4 Create `POST /api/transaction-details` endpoint in `worker/user-routes.ts` for batch insertion.
- [x] 1.5 Create `GET /api/transaction-details` endpoint in `worker/user-routes.ts` with `noGL` filtering.

## 2. Localization & I18n

- [x] 2.1 Add transactional metadata keys to `src/i18n/locales/id/bpm.json`.
- [x] 2.2 Add transactional metadata keys to `src/i18n/locales/en/bpm.json`.
- [x] 2.3 Add upload instruction strings to `src/i18n/locales/id/csa_hub.json`.
- [x] 2.4 Add upload instruction strings to `src/i18n/locales/en/csa_hub.json`.

## 3. UI Refactor: Detail Transaksi

- [x] 3.1 Refactor `src/components/bpm/TransactionSamplingTab.tsx` to use the new `transaction_details` API.
- [x] 3.2 Update table columns in `TransactionSamplingTab` to match the 7-column regulatory format.
- [x] 3.3 Implement `TransactionUploadModal` with `react-dropzone` and standardized ingestion logic.
- [x] 3.4 Integrate `useUnsavedChanges` hook into `BPMModal` for the sampling tab.

## 4. Global Components

- [x] 4.1 Implement `NotificationBell` component with unread badge count.
- [x] 4.2 Integrate `NotificationBell` into the main `Sidebar` or Header.
- [x] 4.3 Trigger "Upload Completed" notification after successful transaction ingestion.

## 5. Data Lifecycle & Audit Trail

- [x] 5.1 Add `transaction_uploads` table to `worker/db/schema.ts` for file metadata tracking.
- [x] 5.2 Implement `DELETE /api/transaction-details/:noGL` endpoint for purging data.
- [x] 5.3 Update `POST /api/transaction-details` to support a `mode: 'append' | 'replace'` flag.
- [x] 5.4 Update `TransactionUploadModal` to include a "Purge and Replace" toggle.
- [x] 5.5 Implement "Upload History" tab/view in the management modal.
