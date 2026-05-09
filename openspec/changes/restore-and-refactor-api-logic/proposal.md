## Why

Endpoint `/api/bpm-diagrams/by-gl` and several CSA-related routes (forensics, PDF export) are currently returning 404 due to incomplete refactoring from the monolith `user-routes.ts`. Restoring these is critical for core business compliance with Regulation SK-5/DKU.MBU/11/2024 and internal audit requirements.

## What Changes

- Restore and refactor the `bpm-diagrams/by-gl` and `by-control` routes into the `bpm.ts` worker module.
- Restore the full CSA sign-off business logic (forensic verification, PDF export) into `csa.ts`.
- Integrate `i18n` support into new/restored endpoints.
- Add an "Unsaved Changes Guard" to CSA forms.
- Include a notification bell in the sidebar for system alerts.
- Execute Drizzle database migrations for required schema updates.
- Refactor according to SOLID, DRY, and Clean Code principles.

## Capabilities

### New Capabilities
- `csa-forensic-verification`: Business logic for forensic metadata and PDF generation.
- `bpm-process-discovery`: Logic for discovering BPM processes by account or control.
- `notification-system-ui`: Notification bell and UI alert handling.

### Modified Capabilities
- `csa-management`: Updating CSA sign-off workflows and validation logic.

## Impact

- `worker/routes/bpm.ts`: New routes and discovery logic.
- `worker/routes/csa.ts`: Business logic restoration.
- `src/components/`: New UI components (Notification bell).
- `src/i18n/`: Localization updates.
