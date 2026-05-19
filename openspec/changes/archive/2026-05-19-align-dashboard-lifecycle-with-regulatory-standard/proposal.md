## Why

The current Dashboard lifecycle visualization (Scoping, Design Effectiveness, Operating Effectiveness, Management Assessment, Remediation Monitoring) does not fully align with the 6-stage Siklus ICOFR defined in Regulation SK-5/DKU.MBU/11/2024 (page 6). Aligning this visualization ensures that BUMN users can track their compliance journey according to the official regulatory framework, improving clarity and auditability.

## What Changes

- **Lifecycle Stages Update**: Replace the existing 5 stages with the 6 regulatory stages: Perancangan, Implementasi & Pemantauan, Evaluasi, Remediasi, Pelaporan, and Asurans Eksternal.
- **Localization**: Add and update translations for the 6 stages in `src/i18n/locales/` for both Indonesian and English.
- **Component Logic**: Update `src/components/dashboard/LifecycleProgress.tsx` to use the new stage IDs and labels.
- **Dashboard Integration**: Update `src/pages/Dashboard.tsx` to pass the correct `currentStage` ID based on the new model.

## Capabilities

### New Capabilities
- `regulatory-lifecycle-tracking`: Implements the 6-stage ICOFR lifecycle (Perancangan, Implementasi, Evaluasi, Remediasi, Pelaporan, Asurans Eksternal) as the primary progress tracker for the application.

### Modified Capabilities
- `csa-management`: Update the mapping of CSA activities to the "Implementasi & Pemantauan" stage.
- `remediation-tracking`: Update the mapping of remediation activities to the "Remediasi" stage.

## Impact

- **UI/UX**: The dashboard will show 6 stages instead of 5, providing a more granular and regulatory-compliant view.
- **Localization**: New strings added to `dashboard.json` in `id` and `en` locales.
- **Frontend Components**: `LifecycleProgress.tsx` and `Dashboard.tsx` will be modified.
