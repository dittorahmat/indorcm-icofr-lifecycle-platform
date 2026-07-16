## Why

Currently, the fiscal years shown in the top-right header selector are hardcoded to a fixed offset based on the current calendar year. There is no mechanism for users to manually add new fiscal years or trigger the rollover of compliance configurations (scoping, RCM, ITGC, etc.) for a future year that is not yet automatically included in the default window. Adding this feature allows flexible lifecycle rollover and year-end close simulations.

## What Changes

- Add a dedicated "+ Tambah Tahun Baru" (or "+ Add New Year" in i18n locales) action button/item to the fiscal year selection dropdown.
- When clicked, display a confirmation dialog/modal where users can input or confirm the new fiscal year to add.
- Persist the added custom years in the Zustand/local storage store (`useFiscalYearStore`) so they show up in the dropdown options list.
- Automatically trigger the rollover prompt if the newly added year has no associated scoping or compliance data, allowing users to copy configuration from the previous year.

## Capabilities

### New Capabilities

- `fiscal-year-expansion`: Provide the interface and storage mechanism to dynamically add new fiscal years beyond the automatically generated range, and trigger the rollover workflow.

### Modified Capabilities

None.

## Impact

- `src/components/layout/FiscalYearSelector.tsx`: Modified to include the action trigger in the select options, customize dropdown behavior, and show the year addition dialog.
- `src/store/useFiscalYearStore.ts`: Modified to store and load custom added years in client state.
- Localization files: Update i18n JSONs to localize dialog and option labels.
