## 1. Responsive State & Mobile Banner

- [x] 1.1 Update `ScopingEditor` in `src/pages/scoping/ScopingPage.tsx` to initialize `isParamsOpen` using `!isMobile` via `useIsMobile()` and enhance the collapsed bar UI for touch accessibility (min-h-[44px]).
- [x] 1.2 Verify `ScopingEditorHeader` toggle button labels and behavior stay synchronized between mobile and desktop views.

## 2. Verification & Testing

- [x] 2.1 Add unit tests in `src/pages/scoping/__tests__/ScopingPage.test.tsx` verifying default collapse on mobile viewports and default expansion on desktop.
- [x] 2.2 Run type-check, lint, build, and tests to verify zero regressions.
