## 1. Sync Script Development

- [x] 1.1 Create `scripts/sync-usage-guide.ts` skeleton with Markdown reading and hashing logic.
- [x] 1.2 Implement hash-based comparison logic using the `documents` table metadata.
- [x] 1.3 Implement "Delete & Replace" logic for `document_chunks` for the `SYSTEM_USAGE_GUIDE` ID.
- [x] 1.4 Integrate `AIService` into the script for embedding generation.

## 2. CI/CD & Persona

- [x] 2.1 Add `npm run sync-guide` to `package.json`.
- [x] 2.2 Update `build` script in `package.json` to include the sync step.
- [x] 2.3 Update AI system instructions in `worker/routes/ai-docs.ts` to include the Product Specialist persona.

## 3. Validation

- [x] 3.1 Manually trigger the sync script and verify chunks are created in the database.
- [x] 3.2 Modify `USAGE_GUIDE.md` slightly and verify that chunks are updated.
- [x] 3.3 Test AI response for a "how-to" question (e.g., "Gimana cara saya mulai CSA?").
