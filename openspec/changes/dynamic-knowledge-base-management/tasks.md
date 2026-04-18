## 1. Database & Infrastructure

- [x] 1.1 Add `documents` and junction tables to `worker/db/schema.ts`
- [x] 1.2 Update `wrangler.jsonc` with Cloudflare R2 bucket binding
- [x] 1.3 Generate and apply database migrations for the new schema
- [x] 1.4 Install lightweight PDF parsing library (e.g., `unpdf`) in the worker

## 2. Backend API Implementation

- [x] 2.1 Implement `POST /api/documents` for PDF upload, text extraction, and storage
- [x] 2.2 Implement `GET /api/documents` with role-based filtering logic
- [x] 2.3 Implement `DELETE /api/documents/:id` with R2 and DB cleanup
- [x] 2.4 Refactor `POST /api/ai/chat` to retrieve dynamic context from the database instead of a static file

## 3. Frontend UI Development

- [x] 3.1 Create the `DocumentsPage` component and register it in the router
- [x] 3.2 Build the "Internal" and "External" tabbed interface for document lists
- [x] 3.3 Create the `UploadDocumentModal` with support for multi-select metadata (Dept/GL/FSLI)
- [x] 3.4 Implement document deletion and download actions in the UI
- [x] 3.5 Update the Sidebar navigation to include the "Dokumen Terkait" menu item

## 4. Verification & Cleanup

- [x] 4.1 Verify text extraction accuracy for multiple sample PDF formats
- [x] 4.2 Validate Role-Based Access Control (RBAC) for Line 1 vs Line 2/3 users
- [x] 4.3 Confirm R2 storage cleanup occurs when a document is deleted
- [x] 4.4 Deprecate and remove the static `ICOFR_KNOWLEDGE_BASE` in `worker/knowledge-base.ts`
