## Why

The IndoGRC Pro codebase currently has several architectural and performance bottlenecks:
1. Critical database operations (e.g., carry forward and BPM diagram updates) perform multiple sequential database updates, inserts, and deletes without database transaction (ACID) guards, risking data inconsistency if any step fails.
2. The error reporter immediately sends an HTTP POST request for every single console warning or error, bypassing the batch queue and deduplication system. This causes network congestion and UI thread blockages.
3. Key pages like `BPMPage.tsx` suffer from component bloat, containing too many local states and derived calculations mixed with UI markup.
4. Hook file naming conventions are inconsistent across kebab-case and PascalCase.
5. Radix UI accessibility warnings are present during unit testing due to missing DialogTitles.

These refactoring updates will harden system reliability, optimize network usage, make the database driver runtime-agnostic (ready for on-premise migration), and resolve code cleanliness issues.

## What Changes

1. **Database Transactions**: Wrap multi-table mutation sequences in Drizzle database transactions (`db.transaction`).
2. **Runtime-Agnostic Database Client**: Refactor the database connection to dynamically load the appropriate driver (`postgres.js` for native TCP on-premise local servers, and `@neondatabase/serverless` WebSocket Pool for Cloudflare Workers demo).
3. **Generic Drizzle Type**: Type the database client as `PgDatabase<any, typeof schema, any>` to ensure compile-time driver agnosticism.
4. **Console Error Queue Batching**: Pipe console interceptors through the batching and deduplication `ErrorReporter.report` queue rather than executing immediate `fetch` calls.
5. **Component Modularization**: Separate complex business logic from `BPMPage.tsx` into a custom hook and split the UI into modular sub-components.
6. **Radix UI Accessibility Fixes**: Include `DialogTitle` in `BPMPage` modal structures to silence accessibility warnings.
7. **Hook File Renaming**: Standardize all files in `src/hooks/` to kebab-case pen-naming.

## Capabilities

### New Capabilities

*(No new functional capabilities are introduced; this is a technical refactoring update)*

### Modified Capabilities

*(No functional requirements are changing; all existing capabilities will remain behaviorally identical)*

## Impact

- **Database Client**: `worker/db/index.ts` will change.
- **Backend Services**: `BpmService.ts`, `ScopingService.ts`, and `ControlService.ts` will be updated to use transactions.
- **Frontend Logger**: `errorReporter.ts` will route console warnings/errors into the queue.
- **Frontend Views**: `BPMPage.tsx` will be modularized.
- **Frontend Hooks**: File names of hook files in `src/hooks` will be renamed to follow kebab-case.
