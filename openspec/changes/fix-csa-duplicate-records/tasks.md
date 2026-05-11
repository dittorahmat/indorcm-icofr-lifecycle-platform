## 1. Backend Implementation

- [x] 1.1 Add `PUT /api/csa/:id` route handler in `worker/routes/csa.ts`
- [x] 1.2 Implement transaction logic for record update and sample resync in the new route
- [ ] 1.3 Verify database migration needs (if any) and update schema if required

## 2. Frontend Integration

- [x] 2.1 Refactor `createMutation` in `useCSA.ts` to support `PUT` requests when `activeCsaId` is set
- [x] 2.2 Verify that `onSaveDraft` properly uses the updated mutation
- [ ] 2.3 Add client-side validation to ensure record updates don't break expected data structures

## 3. Verification & Quality

- [ ] 3.1 Run `npm run lint` and fix any new issues introduced
- [ ] 3.2 Run `tsc` to verify type safety after changes
- [ ] 3.3 Add/Run tests to verify that record updates do not create duplicates
- [ ] 3.4 Build the application (`npm run build`) to ensure no compile errors
