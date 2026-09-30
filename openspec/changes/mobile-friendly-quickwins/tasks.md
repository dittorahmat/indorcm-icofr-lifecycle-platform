## 1. Shell & Header Mobile Optimization

- [x] 1.1 Update `FiscalYearSelector.tsx` to render a compact button variant on mobile (`< 640px`) showing only the year/FY pill, ensuring touch target is at least 44x44px. Verify by checking responsiveness and lack of header overflow.
- [x] 1.2 Optimize `MainHeader.tsx` spacing and logo text clipping on narrow viewports (`< 640px`) to prevent wrapping and element collision. Verify all items fit on 360px viewport.
- [x] 1.3 Adjust `PageHeader.tsx` heading sizes and margins to scale gracefully (`text-xl sm:text-2xl md:text-3xl` and `mb-4 md:mb-8`). Verify titles do not take excessive vertical space on mobile screens.

## 2. CSA Mobile Card View Implementation

- [x] 2.1 Refactor `CSAPage.tsx` to support dual rendering: preserve `<Table className="hidden md:table">` on desktop and introduce a mobile card stack (`<div className="md:hidden space-y-3">`). Verify desktop layout remains intact.
- [x] 2.2 Implement `CSARecordCard` component for mobile display showing process code, unit, Lini 2 validation status, and toggleable review matrix. Verify expandable details work on mobile touch.
- [x] 2.3 Ensure action buttons (PDF export, Excel export, and TOD verification trigger) on mobile cards have >= 44x44px touch targets and full i18n support.

## 3. Verification & Compliance Checks

- [x] 3.1 Run `npm run type-check` and verify TypeScript compiles with zero errors.
- [x] 3.2 Run existing tests via `npm test` and add tests for mobile card rendering in `CSAPage.test.tsx`.
- [x] 3.3 Verify design compliance (strict font >= 12px, institutional radius, no slop).
