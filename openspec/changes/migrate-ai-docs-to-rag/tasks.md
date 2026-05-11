## 1. Database & Infrastructure Setup

- [x] 1.1 Create a Drizzle migration to add `embedding` (vector) and `fts_tokens` (tsvector) columns to the `documents` table.
- [x] 1.2 Create HNSW and GIN indexes for the new columns in the migration file.
- [x] 1.3 Apply migrations to the Neon database.

## 2. Core RAG Service Implementation

- [x] 2.1 Create `worker/services/ai-service.ts` to encapsulate embedding generation and retrieval logic.
- [x] 2.2 Implement `AIService.generateEmbedding` using Gemini or Workers AI.
- [x] 2.3 Implement `AIService.hybridSearch` using the SQL RRF (Reciprocal Rank Fusion) pattern.
- [x] 2.4 Add utility for "Situational Chunking" to prepend document metadata to text fragments.

## 3. Route Refactoring

- [x] 3.1 Update `worker/routes/ai-docs.ts` POST `/documents` to generate and store embeddings upon upload.
- [x] 3.2 Refactor `worker/routes/ai-docs.ts` POST `/ai/chat` to use `AIService.hybridSearch` for context retrieval.
- [x] 3.3 Update the AI chat prompt to handle retrieved snippets and source attribution.

## 4. Legacy Data Migration (Backfill)

- [x] 4.1 Create a standalone script `scripts/backfill-embeddings.ts` to process existing documents.
- [x] 4.2 Implement batch processing and retry logic in the backfill script.
- [x] 4.3 Execute the backfill script and verify that all documents have valid embeddings.

## 5. Verification & Testing

- [x] 5.1 Run `npm run type-check` to ensure no broken imports or type mismatches.
- [x] 5.2 Add unit tests for `AIService.hybridSearch` results ranking.
- [x] 5.3 Perform a manual smoke test: Ask the AI a specific question found in an existing 2024 PDF.
- [x] 5.4 Verify that "SK-5/2024" keyword search works accurately alongside semantic queries.

## 6. Cleanup & Integrity Verification

- [ ] 6.1 Verify that deleting a document from the `DocumentsPage.tsx` UI automatically removes associated fragments in `document_chunks`.
- [ ] 6.2 Confirm that Cloudflare R2 storage is cleaned up when a document is deleted.
- [ ] 6.3 Ensure that "Too Many Requests" (429) errors are handled with exponential backoff during new document uploads.
