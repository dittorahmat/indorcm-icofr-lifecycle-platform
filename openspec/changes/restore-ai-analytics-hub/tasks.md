## 1. Preparation & Setup

- [x] 1.1 Verify presence of `AIHubPage` and `AIAnalyticsMockup` in codebase
- [x] 1.2 Update locale files (en/id) for "AI Analytics" sidebar label

## 2. Component Integration

- [x] 2.1 Update `src/components/app-sidebar.tsx` to include "AI Analytics" in the utility group above Settings
- [x] 2.2 Register `/ai-hub` route in the application router
- [x] 2.3 Ensure `AIHubPage` uses standard `AppLayout` and `ProtectedRoute`

## 3. Verification & Cleanup

- [x] 3.1 Run `npm run lint` and `npm run tsc` to verify types
- [x] 3.2 Verify `UnsavedChangesGuard` integration (if applicable)
- [x] 3.3 Ensure all mock data in `shared/ai-mock-data.ts` is imported correctly
- [x] 3.4 Perform final build verification: `npm run build`
