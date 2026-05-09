## Why

The current scoping logic in `ScopingPage.tsx` incorrectly marks all child GL accounts as significant if the parent FSLI is qualitatively assessed. This causes "scope leakage," making the ICOFR control testing process inefficient by including non-material accounts. Additionally, certain FSLIs (e.g., "Kas dan Setara Kas") are inherently significant due to their nature (fraud risk) and must always be included in the scoping process regardless of current materiality thresholds.

## What Changes

- Modify `significantAccounts` calculation to be FSLI-centric.
- Introduce mandatory significance overrides for critical FSLIs.
- Implement a data cleanup script to prune `significantAccounts` in existing simulations.
- Add notification bell to the UI for better awareness.
- Update sidebar to include relevant navigation.
- Internationalize new UI labels.
- Implement UnsavedChanges guard into the updated scoping flows.

## Capabilities

### New Capabilities
- `scoping-recalc`: Logic to ensure significant account scope is properly calculated at FSLI level, including mandatory overrides.
- `ui-notifications`: Notification system for user awareness.

### Modified Capabilities
- `scoping-management`: Requirement change to enforce strict FSLI scoping and mandatory significance rules.

## Impact

- `ScopingPage.tsx` (Logic change for `significantAccounts`)
- Backend API (`POST /api/simulations`)
- UI Layout (`AppLayout`)
- Database Schema (`simulations` table maintenance)

