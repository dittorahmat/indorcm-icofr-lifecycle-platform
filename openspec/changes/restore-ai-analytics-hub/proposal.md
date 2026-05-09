## Why

The AI Analytics Hub, which was previously part of the ICOFR application to provide enterprise-level digital audit capabilities (Predictive Analytics, Fraud Detection, etc.), was lost during recent UI standardization and sidebar refactoring. Restoring this hub as a utility tool in the footer/utility sidebar group will provide auditors with powerful, AI-driven insights without cluttering the core navigation.

## What Changes

- Restore `AIHubPage` and `AIAnalyticsMockup` components.
- Integrate the AI Analytics link into the `AppSidebar` footer group (above Settings).
- Ensure integration with i18n for localization.
- Add `UnsavedChangesGuard` and required notification alerts.
- Ensure the restored features are compatible with the new Radix UI and Tailwind v4 architecture.
- Run type checks, lint, and build to verify integrity.

## Capabilities

### New Capabilities
- `ai-analytics-hub`: Restoring the digital audit analytics hub including predictive fraud detection and control monitoring dashboards.

### Modified Capabilities
- `navigation`: Updating `AppSidebar` to include the AI Analytics link in the Utility section.

## Impact

- `src/components/app-sidebar.tsx`: Navigation structure updated.
- `src/pages/reports/AIHubPage.tsx`: Restored page entry.
- `src/components/reports/AIAnalyticsMockup.tsx`: Component functionality and styling validated.
- `shared/ai-mock-data.ts`: Mock data management.
