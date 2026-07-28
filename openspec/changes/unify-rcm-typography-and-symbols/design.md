## Context

During previous RCM UI iterations (e.g. `cc84ea6da9063d3341472f447d252c8541c7566f`), table typography was partially standardized to `font-normal text-xs text-slate-800`. However, boolean columns (Key Control, Fraud, IPO, Assertions, COSO) retained visual inconsistency—mixing Lucide icons (`<Shield>`, `<AlertTriangle>`, `<Check>`), raw character codes (`'T'`), and checkmarks (`✓` / `—`).

This design establishes a clean, predictable convention for boolean rendering across all RCM views while finalizing font hierarchy and header internationalization.

## Goals / Non-Goals

**Goals:**
- Replace visual icons/symbols in boolean table cells with plain, high-readability **`Y`** and **`N`** text.
- Ensure consistent column rendering logic across `RCMTLCPage`, `RCMITGCPage`, `RCMELCPage`, `VerificationDesignPage`, and `TLCTabContent`.
- Replace hardcoded column header titles in `RCMITGCPage` with i18n translation strings.

**Non-Goals:**
- Altering underlying backend database schemas or API payload models.
- Changing export formats (Excel/PDF) unless required for symbol rendering alignment.

## Decisions

1. **Standardized Boolean Cell Renderer (`Y` / `N`)**:
   - For any boolean or binary column in table cells:
     - `true` or `'Y'` renders as `'Y'` with `text-xs font-mono text-slate-700 font-bold`.
     - `false` or `'N'` or empty renders as `'N'` with `text-xs font-mono text-slate-400 font-normal`.
   - *Rationale*: Eliminates icon clutter and visual distraction in dense 20+ column financial controls matrices.

2. **Unified Badge Styling**:
   - `riskRating`: Soft pastel badges across TLC, ITGC, ELC, and Verification pages.
   - *Rationale*: Prevents harsh dark red/green solid blocks from breaking visual visual hierarchy.

## Risks / Trade-offs

- **[Risk]**: Users used to visual icons for Key Control (`<Shield>`) or Fraud (`<AlertTriangle>`) might take a moment to adapt to `Y`/`N`.
  - *Mitigation*: Column headers retain tooltips and clear titles ("Fraud", "Key Control?").
