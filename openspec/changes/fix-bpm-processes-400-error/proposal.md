---
title: Fix BPM Processes 400 Error
status: active
---

## Problem
`GET /api/bpm-processes` returns 400 Bad Request because the UI does not pass the `year` parameter, which is required by the backend. This causes CSA schedules to have a blank Detail Activity because the lookup data fails to load.

## Proposed Solution
1. Update `TodoListPage.tsx` to pass `?year=${workingYear}`.
2. Update `useBpmProcesses` in `src/hooks/use-bpm.ts` to accept and pass the year parameter.
