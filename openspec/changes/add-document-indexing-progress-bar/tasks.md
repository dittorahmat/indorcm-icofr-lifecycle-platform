# Tasks: Real-time Auto-updating Document AI Indexing Progress Bar

- [x] 1. Update Database Schema & Auto-Migrations <!-- id: 1 -->
  - Edit [`shared/types.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/shared/types.ts) to include `status` and `indexingProgress` in `Document` type.
  - Edit [`worker/db/schema.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/db/schema.ts) to add `status` and `indexingProgress` columns to `documents` table.
  - Edit [`worker/db/index.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/db/index.ts) to include `ALTER TABLE icofr."documents" ADD COLUMN IF NOT EXISTS "status"` and `indexing_progress`.

- [x] 2. Implement Backend Real-time Progress Tracking <!-- id: 2 -->
  - Edit [`worker/routes/ai-docs.ts`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts)
  - Set `status = 'processing'` and `indexingProgress = 0` on initial document insertion.
  - Update `indexingProgress` percentage periodically during RAG chunking loop.
  - Set `status = 'completed'` and `indexingProgress = 100` when processing finishes.

- [x] 3. Implement Frontend UI Progress Bar & Conditional Auto-Polling <!-- id: 3 -->
  - Edit [`src/pages/knowledge/DocumentsPage.tsx`](file:///home/ubuntu/indorcm-icofr-lifecycle-platform/src/pages/knowledge/DocumentsPage.tsx)
  - Add **Status AI Indexing** column in the documents table.
  - Render Progress bar + percentage + pulsing badge for `'processing'` status.
  - Enable React Query `refetchInterval: hasProcessing ? 3000 : false` for auto-update without F5.

- [x] 4. Verification & Testing <!-- id: 4 -->
  - Run `npm run type-check` to verify TypeScript integrity.
  - Restart backend service `icofr-backend`.
  - Test uploading a new document and verify live auto-updating progress bar.
