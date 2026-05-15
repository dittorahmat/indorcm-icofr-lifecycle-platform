## Context

The `USAGE_GUIDE.md` is the source of truth for application functionality. To keep the AI assistant informed, we need to bridge the gap between this Markdown file and the RAG (Retrieval-Augmented Generation) system.

## Goals / Non-Goals

**Goals:**
- Implement a robust sync mechanism that avoids duplicate indexing.
- Detect changes automatically using content hashing.
- Integrate sync into the build pipeline.

**Non-Goals:**
- Indexing every single file in the repo (only specific "Knowledge" files).
- Real-time sync during a user session (sync happens at build/deploy).

## Decisions

### 1. Fixed Identity (`SYSTEM_USAGE_GUIDE`)
We will use a hardcoded ID for the usage guide in the `documents` table.
- **Rationale:** Simplifies the "Update" logic to a "Delete old chunks -> Insert new chunks" flow without orphan data.

### 2. Content Hashing (SHA-256)
The sync script will calculate a hash of the `USAGE_GUIDE.md` content and store it in the `metadata` column of the `documents` record.
- **Rationale:** Avoids unnecessary calls to Gemini API and database writes if the file hasn't changed.

### 3. Build-Time Execution
The script will be executed during `npm run build`.
- **Rationale:** Ensures that production AI always reflects the production documentation shipped with that specific build.

### 4. Chunking Strategy
Markdown-aware chunking (e.g., splitting by `##` headers) will be used to ensure chunks are semantically coherent.

## Risks / Trade-offs

- **[Risk] Build Time Increase** → Generating embeddings for a large guide can take 10-30 seconds.
  - *Mitigation:* The hash check ensures this only happens when the file actually changes.
- **[Risk] API Key Requirement** → Build server needs `GEMINI_API_KEY`.
  - *Mitigation:* API key must be provided as a secret in the build environment.
