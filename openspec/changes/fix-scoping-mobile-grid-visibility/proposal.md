## Why

On mobile viewports (< 768px), the `ScopingEditor` renders `MaterialityParamsCard` as open by default above the `ScopingEditorContent` (Tabs and GL Data Grid). Because the parameter card and headers take up significant vertical height, the GL table/cards are pushed entirely off-screen below the fold. Users perceive the screen as stuck or that the GL Grid is missing. Defaulting parameters to collapsed on mobile viewports immediately surfaces the GL Data Grid and Worksheet tabs, with an accessible toggle to expand parameters when needed.

## What Changes

- Update `ScopingEditor` to initialize `isParamsOpen` based on viewport width: collapsed by default on mobile devices (`isMobile`), open by default on desktop (`!isMobile`).
- Provide a clean, accessible mobile trigger banner/button to expand/collapse materiality parameters with touch targets >= 44px.
- Ensure seamless transition and consistent toggle state in `ScopingEditorHeader` and the collapsed parameter bar across mobile and desktop.

## Capabilities

### New Capabilities
- `scoping-mobile-view`: Mobile responsive presentation of the Scoping editor ensuring immediate visibility of GL accounts and materiality parameter toggling.

### Modified Capabilities
<!-- None -->

## Impact

- `src/pages/scoping/ScopingPage.tsx`: Adjust `isParamsOpen` default state using `useIsMobile()`, add mobile parameter trigger styling.
- `src/pages/scoping/components/ScopingEditorHeader.tsx`: Align toggle parameter state and labels.
- Tests in `src/pages/scoping/__tests__/ScopingPage.test.tsx` (or new test file).
