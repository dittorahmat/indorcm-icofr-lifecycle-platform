## 1. Global Z-Index Alignment

- [x] 1.1 Update `src/components/ui/select.tsx`: Set `SelectContent` z-index to `z-[1100]`.
- [x] 1.2 Update `src/components/ui/popover.tsx`: Set `PopoverContent` z-index to `z-[1100]`.
- [x] 1.3 Update `src/components/ui/command.tsx`: Ensure command/combobox content inherits or uses `z-[1100]`.

## 2. Code Hygiene & Refactor

- [x] 2.1 Audit and remove any local z-index overrides in `src/pages/scoping/ScopingPage.tsx`.
- [x] 2.2 Scan project for other `z-[...]` or inline `z-index` workarounds and refactor them to use standardized layering.
- [x] 2.3 Refactor any identified "code smells" (e.g., redundant imports, inconsistent naming) in the affected UI files.

## 3. Automated Testing (TDD)

- [x] 3.1 Create a new test file `src/components/ui/__tests__/layering.test.tsx` (or similar) to verify z-index values of Portaled components.
- [x] 3.2 Implement a test case that verifies `SelectContent` z-index > `DialogContent` z-index.
- [x] 3.3 Verify all tests pass (Run `npm test`).

## 4. Final Verification & Build

- [x] 4.1 Run type-check: `npm run type-check`.
- [x] 4.2 Run lint: `npm run lint`.
- [x] 4.3 Run build: `npm run build`.
- [x] 4.4 Final check for broken API endpoints or missing imports after refactor.
