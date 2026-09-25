## 1. Backend Route Enhancement

- [x] 1.1 Update `GET /csa` in `worker/routes/csa.ts` to accept `bpmProcessId` and `scheduleId` query parameters and add them to the SQL `where` conditions. Verify by checking response filtering with query parameters.

## 2. Frontend Integration

- [x] 2.1 Update `UseCSAProps` in `src/hooks/use-csa.ts` to accept `year?: string | number`, pass `bpmProcessId` and `year` in the `queryFn` request URL, and include `year` in the `queryKey`. Verify hook compiles and runs without type errors.
- [x] 2.2 Update `CSATabContent.tsx` to pass `year: workingYear` to `useCSA`. Verify that opening the CSA tab sends both `bpmProcessId` and `year` to the backend.

## 3. Verification & Compliance Checks

- [x] 3.1 Run `npm run type-check` and `npm run lint` to verify type integrity and coding standards.
- [x] 3.2 Run test suite (`npm test`) to ensure no regressions in CSA testing or BPM components.
