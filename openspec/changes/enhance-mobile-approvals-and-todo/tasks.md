## 1. Mobile Agenda View for Todo Calendar

- [x] 1.1 Create `MobileTodoAgenda` component with grouping by Today, Overdue, and Upcoming, verifying it renders cards cleanly with min 12px fonts and no sub-12px styles.
- [x] 1.2 Integrate `MobileTodoAgenda` into `TodoListPage.tsx` using responsive layout switching (`hidden md:block` / `block md:hidden`), verifying both views toggle properly at 768px.
- [x] 1.3 Add test in `TodoListPage.test.tsx` verifying Agenda View displays when viewport is small.

## 2. Touch-Friendly Workflow Approval Sheets

- [x] 2.1 Update `WorkflowPanel.tsx` to conditionally render a bottom Sheet / Drawer on mobile viewports (< 768px) with sticky bottom action buttons (`Approve` and `Reject`) with safe-area insets.
- [x] 2.2 Add institutional quick note preset chips ("Disetujui sesuai lampiran", "Mohon lengkapi bukti sampel") to the mobile approval note form.
- [x] 2.3 Verify workflow tests in `WorkflowPanel.test.tsx` pass without regressions.

## 3. Mobile Navigation & Executive CSA Summary

- [x] 3.1 Update `MobileBottomNav.tsx` to display pending approval counter badge when tasks are waiting for user review/sign-off.
- [x] 3.2 Create and insert an executive summary card above CSA records in `CSAPage.tsx` for mobile viewports displaying effectiveness rate and quick sign-off status.
- [x] 3.3 Add all necessary localization keys to `src/i18n/locales/en/common.json`, `src/i18n/locales/id/common.json`, `csa.json`, and `workflow.json`.

## 4. Verification and Compliance

- [x] 4.1 Run `npm run type-check` and ensure zero TypeScript errors.
- [x] 4.2 Run `npm run lint` and ensure clean code standards.
- [x] 4.3 Run `npm test` and verify all tests pass.
