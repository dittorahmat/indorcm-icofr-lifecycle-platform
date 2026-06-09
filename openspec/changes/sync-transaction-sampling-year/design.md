## Context

The transaction sampling system is currently out of sync with the global fiscal year. Data uploaded previously defaults to 2024, while the system is operating in 2026. The backend API is also misaligned with the frontend's batch-oriented upload process.

## Goals / Non-Goals

**Goals:**
- Enable year-based filtering for transactions in the BPM workspace.
- Ensure backend supports batch insertion of transactions.
- Provide a one-time migration path for existing data.

**Non-Goals:**
- Implementing the `bpm_code` column (as per user request to skip).
- Redesigning the entire transaction database schema.

## Decisions

### 1. Unified Year Filtering
- **Decision**: Integrate `useFiscalYearStore` into `TransactionSamplingTab` and pass `year` as a query parameter to the `GET /api/transaction-details` endpoint.
- **Rationale**: Ensures consistency with the global application state.
- **Alternatives**: Filtering purely on the client side (inefficient for large datasets).

### 2. Batch Processing for Uploads
- **Decision**: Update `POST /api/transaction-details` to expect `{ rows: TransactionDetail[], noGL: string, mode: 'replace' | 'append', ... }`.
- **Rationale**: Aligns backend with current frontend behavior in `TransactionUploadModal.tsx`.
- **Alternatives**: Sending multiple individual requests (high overhead, risk of partial failure).

### 3. Replace Mode Implementation
- **Decision**: In `replace` mode, the backend will delete all transactions for the specified `noGL` before inserting new ones.
- **Rationale**: Simple and predictable data management for specific GL accounts.

## Risks / Trade-offs

- **[Risk]** Large batch uploads might time out on Cloudflare Workers. → **Mitigation**: Limit batch size to 1000 rows (current limit in GET as well) or optimize insertion logic.
- **[Risk]** Data loss during "Replace" mode if insertion fails after deletion. → **Mitigation**: Use a transaction if supported by the D1 environment, or ensure client-side retries. (D1 transactions are currently limited in some contexts, but simple multi-statement execution is possible).
