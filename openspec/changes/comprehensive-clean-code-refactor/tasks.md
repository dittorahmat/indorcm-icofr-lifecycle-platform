## 1. Backend Foundation (Audit & RBAC)

- [x] 1.1 Create `worker/services/audit-service.ts` with automated diffing logic for `dataBefore` and `dataAfter`.
- [x] 1.2 Create `worker/lib/guard.ts` with declarative Hono RBAC middleware (`rbac(roles: UserRole[])`).
- [x] 1.3 Update `worker/app.ts` to integrate new middleware and verify global error handling.

## 2. Backend Service Layer Extraction

- [x] 2.1 Create `worker/services/rcm-service.ts` and migrate RCM-specific business logic and Drizzle queries.
- [x] 2.2 Create `worker/services/control-service.ts` and migrate Control-specific logic and linkage validation.
- [x] 2.3 Refactor `worker/routes/rcm.ts` to use the new services and apply the RBAC middleware to relevant endpoints.
- [x] 2.4 Refactor `worker/routes/scoping.ts` to fully delegate business logic to `ScopingService`.

## 3. Frontend Domain Hooks

- [x] 3.1 Create `src/hooks/use-controls.ts` to encapsulate all `useQuery` and `useMutation` logic for Controls.
- [x] 3.2 Create `src/hooks/use-rcm.ts` to encapsulate logic for RCM matrix and matrix updates.
- [x] 3.3 Create `src/hooks/use-scoping.ts` for Materiality Simulations and GL Snapshot management.

## 4. Component Refactoring & Constants

- [x] 4.1 Extract static UI data (COSO principles, frequencies, nature types) from components into `src/lib/constants.ts`.
- [x] 4.2 Decompose `src/pages/rcm/RCMList.tsx` into smaller, presentational components (e.g., `RcmTlcTable`, `RcmItgcTable`).
- [x] 4.3 Refactor `src/components/rcm/ControlEditor.tsx` by splitting the large form into sub-components for Risk, Regulatory, and ITGC data.

## 5. Verification & Testing

- [ ] 5.1 Verify that audit logs are correctly generated with meaningful diffs after entity updates.
- [ ] 5.2 Verify that RBAC middleware correctly blocks unauthorized roles (e.g., Line 1 trying to access Admin-only validation).
- [ ] 5.3 Perform end-to-end smoke tests on RCM, Scoping, and Control management flows.
- [ ] 5.4 Run `npm run build` and `npm run lint` to ensure total project integrity.
