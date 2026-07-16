## Context

Currently, the fiscal year selector dropdown gets its options from a dynamic array generated relative to the current year (`currentYear - 3` to `currentYear + 1`). State is persisted using a client-side Zustand store `useFiscalYearStore` in `src/store/useFiscalYearStore.ts`. We need to allow adding years outside this dynamic range.

## Goals / Non-Goals

**Goals:**
- Add a "+ Tambah Tahun Baru" action at the bottom of the fiscal year dropdown.
- Provide a clean Dialog/Modal to confirm and input a new fiscal year.
- Persist custom-added years to `useFiscalYearStore` so they appear in the options.

**Non-Goals:**
- Modifying backend server schemas for list of years (persisting client-side in the existing Zustand local storage state is sufficient).

## Decisions

### 1. Store Expansion
We will expand `useFiscalYearStore` to:
- Hold an array of `customYears: string[]` (initialized as empty).
- Provide an action `addCustomYear(year: string)`.
- Merge both standard years and `customYears` when rendering options in the selector.

### 2. Radix UI Select Interception
Since we are using `<Select>` from `@/components/ui/select`, selecting the `+ Tambah Tahun Baru` item would normally set the value of the Select to that action's value. We will:
- Check if `val === 'add-new-year'` in the Select's `onValueChange` handler.
- If so, prevent updating `workingYear` to `'add-new-year'` and instead set a local state `isAddYearDialogOpen` to `true`.
- Display a `<Dialog>` to let the user choose/input the new year. Once confirmed, we call `addCustomYear(newYear)` and set `workingYear` to the new year.

## Risks / Trade-offs

- **[Risk]** User enters invalid years (e.g. non-numeric or long future years).
  * **Mitigation**: Add validation in the dialog to restrict inputs to 4-digit numbers and check that the year is not already in the options.
- **[Risk]** Storing custom years only in `localStorage` could lead to data inconsistency across different devices/browsers.
  * **Mitigation**: This matches the existing design of storing the active `workingYear` inside `localStorage` (Zustand persistent storage).
