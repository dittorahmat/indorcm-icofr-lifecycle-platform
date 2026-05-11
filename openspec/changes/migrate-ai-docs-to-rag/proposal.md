## Why

The current AI document search uses a "naive" context-stuffing approach that fetches entire document contents into the prompt, leading to high token costs, slow latency, and potential context window overflows as the document library grows. Migrating to a RAG (Retrieval-Augmented Generation) architecture using `pgvector` on Neon will allow for precise, semantic retrieval of only the most relevant document fragments, significantly improving accuracy and scalability.

## What Changes

- **Vector Database Integration**: Enable and utilize `pgvector` in the existing Neon PostgreSQL database.
- **Hybrid Search Engine**: Implement a search mechanism that combines semantic vector search with keyword-based full-text search (BM25) for maximum precision.
- **Automated Embedding Pipeline**: Update the document upload process to automatically generate and store embeddings for new files.
- **Legacy Data Migration**: Provide a backfill script to generate embeddings for all existing documents in the database.
- **Optimized Chat API**: Refactor the `/ai/chat` endpoint to perform retrieval-augmented generation instead of full-text context stuffing.
- **Clean Code Architecture**: Encapsulate RAG logic into a dedicated `AIService` following SOLID and DRY principles.

## Capabilities

### New Capabilities
- `vector-search-engine`: Core infrastructure for semantic retrieval and embedding management.
- `contextual-document-retrieval`: Advanced retrieval strategy that preserves situational context for text chunks.

### Modified Capabilities
- `dynamic-knowledge-base-management`: Updating the document management flow to include embedding generation and storage.

## Impact

- **Database**: Schema updates to `documents` table (adding `embedding` and `fts_tokens` columns).
- **Worker**: New service layer for AI operations; refactored `/ai/chat` and `/documents` routes.
- **Dependencies**: Addition of embedding generation logic (Gemini/Workers AI).
- **Cost/Performance**: Significant reduction in token usage per query; faster response times for large document sets.
