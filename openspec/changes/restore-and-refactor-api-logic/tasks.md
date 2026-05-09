## 1. Database & Infrastructure

- [x] 1.1 Run Drizzle migration (`npx drizzle-kit push`) to ensure schema parity.
- [x] 1.2 Validate database connectivity and env variables.

## 2. Worker Route Restoration

- [x] 2.1 Restore `/api/bpm-diagrams/by-gl/:noGL` and `/by-control/:controlId` in `worker/routes/bpm.ts`.
- [x] 2.2 Restore full CSA forensic sign-off and PDF logic in `worker/routes/csa.ts`.
- [x] 2.3 Refactor routes to use shared utilities (`worker/lib/`) following Clean Code/SOLID principles.

## 3. UI & Localization

- [x] 3.1 Implement notification bell in `src/components/app-sidebar.tsx`.
- [x] 3.2 Update `src/i18n/` for newly restored/added endpoints.
- [x] 3.3 Integrate "Unsaved Changes Guard" for CSA management.

## 4. Quality & Verification

- [x] 4.1 Execute build and ensure no compilation errors.
- [x] 4.2 Run linting (`npm run lint`) and fix all issues.
- [x] 4.3 Run type-checking (`tsc`) and ensure full type safety.
- [x] 4.4 Verify all endpoints function as expected (E2E testing).
