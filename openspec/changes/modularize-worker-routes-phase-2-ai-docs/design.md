## Context

Continuing the modularization strategy started in Phase 1, we are targeting the AI Chatbot and Knowledge Base (Document Management) modules. These modules are currently embedded in `worker/user-routes.ts` and require specialized libraries for AI interaction and PDF processing.

## Goals / Non-Goals

**Goals:**
- Extract all AI and Document routes into `worker/routes/ai-docs.ts`.
- Isolate imports for `@google/generative-ai`, `unpdf`, and `jspdf`.
- Ensure R2 bucket access (`DOCUMENTS_BUCKET`) remains functional within the sub-app.
- Preserve existing path structures so the frontend remains unaffected.

**Non-Goals:**
- Refactoring the internal logic of AI prompts or PDF extraction.
- Changing the storage schema or R2 bucket configuration.
- Modularizing BPM or Scoping routes (reserved for later phases).

## Decisions

### 1. Sub-App Structure: `worker/routes/ai-docs.ts`
We will follow the pattern established in Phase 1:
- Create a `new Hono<HonoEnv>()` instance.
- Define routes with relative paths.
- Export as `default`.

### 2. Dependency Relocation
The following heavy/specialized imports will be moved from `worker/user-routes.ts` to `worker/routes/ai-docs.ts`:
- `GoogleGenerativeAI`
- `getDocumentProxy`, `extractText` (unpdf)
- `jsPDF` (lazy-loaded or direct import)
- `ICOFR_KNOWLEDGE_BASE` constant (if only used here)

### 3. Orchestration
The sub-app will be mounted in `worker/app.ts`:
```typescript
app.route('/api/ai', aiDocsSubApp);
app.route('/api/documents', aiDocsSubApp);
app.route('/api/files', aiDocsSubApp); // For file serving
app.post('/api/upload', ...); // Consider if this belongs in ai-docs or its own file
```

### 4. Shared Middleware
The sub-app will inherit global middleware (Auth) from the main `app` instance since it is mounted *after* the middleware registration in `worker/app.ts`.

## Risks / Trade-offs

- **[Risk] R2 Bucket Access** → Sub-apps might have issues accessing `c.env.DOCUMENTS_BUCKET` if not typed correctly.
  - *Mitigation*: Ensure `HonoEnv` correctly includes all Cloudflare Bindings.
- **[Risk] PDF Generation Overhead** → `jspdf` is large.
  - *Mitigation*: Keep using dynamic imports (`import('jspdf')`) within the route handler to keep the initial worker bundle load fast.
