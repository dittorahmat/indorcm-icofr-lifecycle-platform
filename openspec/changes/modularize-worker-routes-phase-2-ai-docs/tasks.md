## 1. Sub-App Creation

- [x] 1.1 Create `worker/routes/ai-docs.ts` with the basic Hono sub-app scaffold.
- [x] 1.2 Move specialized constants like `rateLimitStore` and `ICOFR_KNOWLEDGE_BASE` to the new file.

## 2. Extraction: Knowledge Base (Documents)

- [x] 2.1 Identify and move all `/api/documents/*` route handlers from `worker/user-routes.ts` to `ai-docs.ts`.
- [x] 2.2 Identify and move file-related routes: `/api/upload` and `/api/files/*`.
- [x] 2.3 Strip prefixes and adjust paths to be relative in the new sub-app.
- [x] 2.4 Relocate `unpdf` imports and text extraction logic.

## 3. Extraction: AI Chat

- [x] 3.1 Identify and move the `/api/ai/chat` route handler to `ai-docs.ts`.
- [x] 3.2 Relocate `@google/generative-ai` imports and AI model configuration.
- [x] 3.3 Ensure the rate-limiting logic is preserved and correctly scoped.

## 4. Orchestration & Cleanup

- [x] 4.1 Import and mount the `ai-docs` sub-app in `worker/app.ts`.
- [x] 4.2 Update `AppType` chaining to include the new routes.
- [x] 4.3 Remove extracted code and specialized imports from `worker/user-routes.ts`.
- [x] 4.4 Verify all relative imports in `ai-docs.ts` are correct (e.g., `../db`, `../lib/utils`).

## 5. Verification

- [x] 5.1 Run `npm run build` to verify type safety and compilation.
- [x] 5.2 Manually verify the AI chat endpoint remains functional.
- [x] 5.3 Manually verify document upload and R2 retrieval.
