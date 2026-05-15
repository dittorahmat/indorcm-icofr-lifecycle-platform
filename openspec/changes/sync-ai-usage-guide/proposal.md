## Why

The AI Chatbot currently lacks knowledge about how to use the IndoGRC Pro application itself. While it understands external regulations and live data, it cannot answer "how-to" questions found in the `USAGE_GUIDE.md`. To ensure the AI is always up-to-date with the latest features and documentation, we need an automated synchronization mechanism that indexes the usage guide into the AI's knowledge base whenever changes occur.

## What Changes

- **Automated Sync Script**: Create a script `scripts/sync-usage-guide.ts` that reads `USAGE_GUIDE.md`, calculates a hash, and updates the database vector store if changes are detected.
- **System Document Identification**: Reserve a specific document ID (`SYSTEM_USAGE_GUIDE`) for the guide to allow seamless updates without duplication.
- **Build-Time Integration**: Add a hook to `package.json` to run the sync script during the build/deploy process.
- **AI Persona Enhancement**: Update the AI's system instructions to recognize itself as a Product Specialist for IndoGRC Pro.

## Capabilities

### New Capabilities
- `ai-knowledge-autosync`: Mechanism to automatically keep the AI's application knowledge in sync with Markdown documentation.

## Impact

- **Database**: The `documents` and `document_chunks` tables will now host system-level documentation with a fixed ID.
- **DevOps/CI-CD**: The build process will include a step to communicate with the Gemini API and update the vector store.
- **AI Service**: `AIService` will have more relevant context for product-specific questions.
