## 1. Localization Setup

- [x] 1.1 Update `src/i18n/locales/id/scoping.json` with new tab labels (`tabWorksheet`, `tabIntegrity`).
- [x] 1.2 Update `src/i18n/locales/en/scoping.json` with new tab labels (`tabWorksheet`, `tabIntegrity`).

## 2. Refactor ScopingEditor Tabs

- [x] 2.1 Modify `ScopingEditor` component in `src/pages/scoping/ScopingPage.tsx` to update `TabsList` to 3 columns.
- [x] 2.2 Add `TabsTrigger` for "Data Integrity" at the end of the list.
- [x] 2.3 Refactor `TabsContent` for `worksheet` to remove `<ScopingHealthDashboard />`.
- [x] 2.4 Add `TabsContent` for `integrity` and move `<ScopingHealthDashboard />` inside it.
- [x] 2.5 Ensure all tab triggers use the updated translation keys.

## 3. Verification

- [x] 3.1 Verify tab labels in both English and Indonesian.
- [x] 3.2 Verify that `ScopingHealthDashboard` only appears when the "Data Integrity" tab is active.
- [x] 3.3 Verify that `GLDataGrid` is immediately visible when opening a simulation.
