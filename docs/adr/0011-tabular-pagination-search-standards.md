# 0011 - Tabular Pagination and Search Standardization

- **Status:** Accepted
- **Date:** 2026-11-23
- **Context:** Tabular listing components across IndoGRC Pro (RCM Master List, Scoping GL Data Grid, Deficiency Summary / DoD Table, etc.).

## Problem

Multiple high-volume tabular interfaces either render their entire dataset in a single unpaginated list or lack unified search/filter controls:
- **RCM Master List (`RCMList.tsx` / `RCMTable.tsx`)** has search and category filtering, but renders all controls without page boundaries, degrading layout performance and vertical scroll navigation when dataset exceeds hundreds of controls.
- **Scoping GL Data Grid (`GLDataGrid.tsx`)** renders large General Ledger account structures without paging controls.
- **Deficiency Summary / DoD Table (`Appendix10Page.tsx` / `DoDTable.tsx`)** and regulatory log views lack integrated keyword search and pagination.

## Decision

1. **Standardized Client-Side Paging Slice:** For datasets fetched in full by TanStack Query / React Query, standardize on a reusable client-side pagination controller (`DataTablePagination`) providing deterministic page sizes (default 10, with 25/50 options) and page navigation buttons.
2. **Search-Synchronized Page Reset:** Any change to active search terms, status filters, or category selectors must automatically reset the active page index to 1 (`currentPage = 1`) to prevent empty-state dead zones.
3. **Density-Preserving Layout:** The pagination bar must adhere strictly to sovereign enterprise density guidelines (`docs/standards/ui-density.md`), with minimum 44px mobile touch targets, `text-xs` typography, and institutional border styling.
4. **Tracer-Bullet Phased Rollout:** Implement first on the three highest-volume operational tables (RCM Master List, GL Data Grid, and DoD Table), followed by remaining regulatory tables.

## Consequences

- Prevents browser DOM bloat on large enterprise datasets.
- Consistent user experience across all list and worksheet modules.
- Leaves backend API contracts intact while preparing for future server-side cursor/offset queries if datasets grow to tens of thousands of rows.
