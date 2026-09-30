## 1. Wipeout Script Implementation

- [x] 1.1 Create `worker/db/wipeout-demo.ts` with atomic SQL truncate transaction for transactional and operational tables, with interactive prompt / confirmation flag (`--confirm`) and row count reports.
- [x] 1.2 Register `db:wipeout` script in `package.json` and verify help/dry-run message without performing live truncation.

## 2. Verification & Manual Execution Guide

- [x] 2.1 Verify TypeScript type checking on the worker project (`npx tsc --noEmit -p tsconfig.worker.json`).
- [x] 2.2 Provide step-by-step user manual for the operator to execute the wipeout command independently when ready.
