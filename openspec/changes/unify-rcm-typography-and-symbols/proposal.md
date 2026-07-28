## Why

Currently, the Risk Control Matrix (RCM) screens (`RCMTLCPage`, `RCMITGCPage`, `RCMELCPage`, `VerificationDesignPage`, and `TLCTabContent`) exhibit inconsistent typography, badge styling, and boolean representation formats across tables. Specifically, icon graphics (like `<Shield>`, `<AlertTriangle>`, `<Check>`), checkmarks (`✓`), dash symbols (`—`), and arbitrary characters (`T`) are mixed across different RCM tables for boolean states. Unifying typography and simplifying all boolean indicators to clean, standard `Y` / `N` text improves visual clarity, reduces clutter, and ensures full consistency across the IndoGRC Pro platform.

## What Changes

- **Simplify Boolean Indicators**: Standardize all boolean fields in RCM tables (`Key Control`, `Fraud Indicator`, `IPO (C, A, V, RA)`, `Assertions (E, C, A, CO, R&O, V/A, PD)`, `COSO Principles (1-17)`) to display simple text **`Y`** (Yes) and **`N`** (No).
- **Unify Control Code Typography**: Standardize Control Reference codes across all RCM views to `font-mono text-xs font-normal text-slate-600` for consistent legibility without overpowering row text.
- **Unify Risk Rating Badge Styling**: Apply consistent soft badge colors across all RCM pages (`High`: `bg-rose-50 text-rose-700 border-rose-200`, `Medium`: `bg-amber-50 text-amber-700 border-amber-200`, `Low`: `bg-emerald-50 text-emerald-700 border-emerald-200`).
- **Standardize ITGC Table Headers**: Replace hardcoded/abbreviated header titles in `RCMITGCPage` with standardized i18n translation keys.

## Capabilities

### Modified Capabilities
- `unify-typography`: Extend existing typography and symbol standardization spec to cover boolean representation (`Y/N`) and table styling across all RCM sub-pages (`TLC`, `ITGC`, `ELC`, `Verification Design`).

## Impact

- **Frontend Pages/Components**:
  - `src/pages/rcm/RCMTLCPage.tsx`
  - `src/pages/rcm/RCMITGCPage.tsx`
  - `src/pages/rcm/RCMELCPage.tsx`
  - `src/pages/rcm/VerificationDesignPage.tsx`
  - `src/components/rcm/TLCTabContent.tsx`
- **i18n Locales**:
  - `src/i18n/locales/en/rcm.json`
  - `src/i18n/locales/id/rcm.json`
