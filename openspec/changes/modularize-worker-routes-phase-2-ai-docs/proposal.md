## Why

The `worker/user-routes.ts` file remains excessively large (~3,800 lines). The AI Chat and Knowledge Base (Documents) modules represent a significant chunk of this file and introduce unique external dependencies like Google AI SDK and PDF parsing libraries. Moving these to a dedicated sub-app continues our modularization strategy, reduces file complexity, and isolates specialized dependencies.

## What Changes

- **AI & Documents Routing Extraction**: Move all `/api/ai/*`, `/api/documents/*`, and file-related routes (`/api/files/*`, `/api/upload`) from `worker/user-routes.ts` to a new dedicated sub-app in `worker/routes/ai-docs.ts`.
- **Dependency Isolation**: Move specialized imports (`@google/generative-ai`, `unpdf`, `jspdf`) out of the main route file.
- **Main App Orchestration**: Mount the new `ai-docs` sub-app in `worker/app.ts` under the `/api` prefix (or sub-prefixes as appropriate).
- **Cleanup**: Remove the extracted code and unused imports from the monolithic `worker/user-routes.ts`.

## Capabilities

### New Capabilities
- `modular-ai-knowledge-base`: Modularizes the AI chatbot and regulatory document management system into a standalone route module.

### Modified Capabilities
<!-- No requirement changes. -->

## Impact

- `worker/user-routes.ts`: Size reduction of ~250-300 lines.
- `worker/routes/ai-docs.ts`: New file created for the sub-app.
- `worker/app.ts`: Updated to register the new sub-app.
- **Internal APIs**: No changes to frontend consumption (paths remain identical via mount points).
