## Context

The current document search in IndoGRC Pro relies on loading full text contents from the `documents` table into the LLM prompt. While effective for small datasets, it faces scalability limits. Neon PostgreSQL (already verified to have `pgvector` installed) provides the necessary infrastructure for semantic search.

## Goals / Non-Goals

**Goals:**
- Implement a Hybrid Search (Semantic + Keyword) using `pgvector` and `tsvector`.
- Automate embedding generation for both new and legacy documents.
- Refactor the AI chat route to utilize retrieved context snippets.
- Ensure the architecture is compatible with standard PostgreSQL for future migration.

**Non-Goals:**
- Implementing a separate vector database (e.g., Pinecone). We stick to PostgreSQL.
- Changing the frontend UI components (the chat interface remains the same).

## Decisions

### 1. Hybrid Search with RRF (Reciprocal Rank Fusion)
**Decision**: Use SQL-based RRF to combine results from `pgvector` (semantic) and `tsvector` (BM25/Keyword).
**Rationale**: Vector search is great for meaning, but keyword search is essential for technical terms (e.g., "SK-5/2024"). RRF provides a mathematically sound way to rank results from both.
**Alternatives**: Using only vector search. Rejected because it frequently misses exact regulatory references.

### 2. Situational/Contextual Chunking
**Decision**: Prepend each text chunk with a situational summary (e.g., "[Document: SOP-Audit-2024]").
**Rationale**: Prevents "context loss" when a large document is split into small fragments. The retriever and LLM will always know which document a fragment belongs to.

### 3. Model Selection for Embeddings
**Decision**: Use Cloudflare Workers AI `@cf/baai/bge-small-en-v1.5` or Gemini's `text-embedding-004`.
**Rationale**: Staying within the Cloudflare/Gemini ecosystem reduces latency and cost.
**Alternatives**: OpenAI Embeddings. Rejected due to external dependency and higher latency.

### 4. Database Column Type
**Decision**: Use `vector(768)` or `halfvec` if supported by the chosen model.
**Rationale**: `halfvec` (16-bit) halves storage and memory requirements in Neon while maintaining accuracy.

### 5. Automated Cleanup & Integrity
**Decision**: Use PostgreSQL `ON DELETE CASCADE` for all related tables (`document_chunks`, `document_departments`, etc.).
**Rationale**: Ensures that deleting a document automatically wipes all its granular RAG fragments and embeddings without requiring complex manual deletion logic in the application layer.
**File Storage**: Explicitly delete the corresponding PDF from Cloudflare R2 during the document deletion process.

## Risks / Trade-offs

- **[Risk]** Embedding generation fails during bulk migration → **Mitigation**: Implement a retry mechanism and state tracking in the backfill script.
- **[Risk]** High latency during hybrid search → **Mitigation**: Use HNSW index for the vector column and GIN index for the FTS column.
- **[Risk]** Database migration to standard Postgres → **Mitigation**: Use standard `pgvector` SQL and Avoid Neon-exclusive extensions.

## Migration Plan

1. **Phase 1**: Update Drizzle schema and push migrations to Neon.
2. **Phase 2**: Run the backfill script to process existing 2024/2025 documents.
3. **Phase 3**: Swap the AI chat logic to use the new `AIService` retrieval.
4. **Phase 4**: Enable auto-embedding on the `/documents` upload route.
