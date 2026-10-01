## 1. Resilient Chunk Loading Utilities

- [x] 1.1 Implement `lazyWithRetry` in `src/lib/lazyWithRetry.ts` with exponential retry backoff, stale chunk detection, and 1-shot sessionStorage reload guard, and verify with unit tests in `src/lib/__tests__/lazyWithRetry.test.ts`
- [x] 1.2 Add the global `vite:preloadError` listener in `src/main.tsx` with duplicate reload suppression to gracefully intercept stale bundle preloads

## 2. Route Integration & Error Boundary Hardening

- [x] 2.1 Refactor all page route lazy declarations in `src/main.tsx` and `src/components/layout/AppLayout.tsx` to use `lazyWithRetry` instead of plain `React.lazy`
- [x] 2.2 Enhance `src/components/RouteErrorBoundary.tsx` to detect dynamic import / chunk load failures, categorize them accurately in `errorReporter`, and provide an immediate reload option
- [x] 2.3 Audit all navigation links in `src/components/app-sidebar.tsx` to guarantee consistent `withYear()` usage across all menu items

## 3. Verification & Quality Assurance

- [x] 3.1 Execute unit and component tests (`npm test`) to ensure resilient route loading tests pass
- [x] 3.2 Run type-check (`npm run type-check`), linter (`npm run lint`), and production build (`npm run build`) to confirm full compliance with repository standards
