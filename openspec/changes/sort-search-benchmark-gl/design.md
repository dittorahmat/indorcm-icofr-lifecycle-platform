## Context

In `SmartImportWizard.tsx`, Step 3 (Baselining) allows users to select a benchmark basis from candidate FSLI accounts calculated from parsed GL data. Currently, candidate FSLIs are sorted by total balance descending and presented in a simple Radix Select component without search. In datasets with dozens of FSLI lines, locating a specific account is difficult.

## Goals / Non-Goals

**Goals:**
- Sort `uniqueFsliData` by `minNoUrut` ascending, falling back to name comparison.
- Replace `<Select>` with a searchable Combobox (`Popover` + `Command` or search input filter) so users can filter benchmark accounts by name.

**Non-Goals:**
- Modify external `SetBenchmarkModal` component (confirmed out of scope for this change).
- Modify backend migration API endpoints.

## Decisions

### Decision 1: Candidate Sorting Rationale
Sort `uniqueFsliData` by `minNoUrut` ascending first. If `minNoUrut` is equal or absent (defaulted to 999999), sort alphabetically by `name`.

### Decision 2: Searchable Combobox Component Structure
Use UI popover + command components (or custom inline search popover matching project design system) for `SmartImportWizard` benchmark basis field. Render search input at top of list, item name, and right-aligned formatted currency amount.

## Risks / Trade-offs

- [Risk] Large list of FSLIs (100+) inside popover → [Mitigation] Limit max-height of `CommandList` / popover scroll container to 300px with virtual scroll / efficient item rendering.
