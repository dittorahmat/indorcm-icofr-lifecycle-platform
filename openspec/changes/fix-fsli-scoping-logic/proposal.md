## Why

The current scoping logic in `ScopingPage.tsx` incorrectly marks all child GL accounts as significant if the parent FSLI is qualitatively assessed. This causes "scope leakage," making the ICOFR control testing process inefficient by including non-material accounts.

## What Changes

- Modify `significantAccounts` calculation to be FSLI-centric.
- Implement a data cleanup script to prune `significantAccounts` in existing simulations.
- Add notification bell to the UI for better awareness.
- Update sidebar to include relevant navigation.
- Internationalize new UI elements.
- Implement UnsavedChanges guard for new interactions.

## Capabilities

### New Capabilities
- `scoping-recalc`: Logic to ensure significant account scope is properly calculated at FSLI level.
- `ui-notifications`: Notification system for user awareness.

### Modified Capabilities
- `scoping-management`: Requirement change to enforce strict FSLI scoping.

## Impact

- `ScopingPage.tsx` (Logic change for `significantAccounts`)
- Backend API (`POST /api/simulations`)
- UI Layout (`AppLayout`)
- Database Schema (`simulations` table maintenance)
