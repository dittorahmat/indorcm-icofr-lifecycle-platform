## 1. Backend: BpmService Cleanup

- [x] 1.1 Modify `deleteProcess` in `worker/services/bpm-service.ts` to use sequential decoupling (neon-http does not support transactions).
- [x] 1.2 Update all records in `controls` where `bpmProcessId` matches the target ID, setting it to `null`.
- [x] 1.3 Update all records in `csa_records` where `bpmProcessId` matches the target ID, setting it to `null`.
- [x] 1.4 Finally, delete the `bpm_processes` record.

## 2. Verification

- [x] 2.1 Manually verify (via API or UI) that a process with linked controls can now be deleted without error.
- [x] 2.2 Verify that the linked controls still exist in the database but have their `bpmProcessId` set to `null`.
