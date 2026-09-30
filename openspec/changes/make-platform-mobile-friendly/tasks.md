## 1. Shell & Floating Elements Responsiveness

- [x] 1.1 Adjust `AIFabButton` positioning with `bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6` to avoid overlapping with `MobileBottomNav`, and verify clearance on mobile viewport simulation.
- [x] 1.2 Refactor `MainHeader.tsx` to handle compact mobile displays (< 380px) gracefully by wrapping or collapsing secondary badges into dropdown menus, and verify header height remains 64px without text truncation.
- [x] 1.3 Verify and ensure `MobileBottomNav.tsx` items maintain 44x44px minimum touch targets and handle safe-area padding consistently across devices.

## 2. RCM Matrix Table-to-Card Engine

- [x] 2.1 Enhance `RCMTable.tsx` with a dual-view presentation: render the wide table for `md` and above, and render a structured card feed (`md:hidden`) showing Control Code, Risk, Nature, Assertions, and Effectiveness status.
- [x] 2.2 Add quick-action touch controls on RCM mobile cards for Edit, Line 2 Validation inspection, and detail expansion, and verify actions trigger appropriate handlers.
- [x] 2.3 Verify `TLCTabContent.tsx`, `ELCTabContent.tsx`, and `ITGCTabContent.tsx` render cleanly on mobile viewports (< 768px) using the new card layout without horizontal page scrolling.

## 3. Form Modals and Detail Drawers

- [x] 3.1 Update `RCMEditDialog.tsx` to adapt smoothly between centered modal on desktop and full/sheet layout on mobile viewports, ensuring action buttons stay sticky and accessible above virtual keyboards.
- [x] 3.2 Ensure touch inputs and select triggers across mobile forms maintain a minimum height of 44px (`min-h-[44px]`) and font size of at least 12px (`text-xs` / `text-sm`).

## 4. Verification & Testing

- [x] 4.1 Execute `npm run type-check` (via `npx tsc --noEmit -p tsconfig.app.json`) and verify zero TypeScript compilation errors.
- [x] 4.2 Execute `npm run lint` and verify zero lint errors across modified components.
- [x] 4.3 Run existing unit tests (`npm test`) and add unit test coverage verifying responsive card rendering in `RCMTable.test.tsx`.
- [x] 4.4 Run `npm run build` and ensure clean production build output.
