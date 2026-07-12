## Context

Accidental deletion of data in the scoping module due to a lack of confirmation prompts poses a significant operational risk. This design standardizes deletion confirmation prompts to use the Shadcn/UI `<AlertDialog>` component, which is already used in `RegulatoryPropertySheet.tsx`.

## Goals / Non-Goals

**Goals:**
- Implement state-controlled `AlertDialog` modals for both simulation and snapshot deletion on `ScopingPage.tsx`.
- Connect the trash icons in `SimulationListTable` and `GLSourceTable` to state triggers rather than directly to the delete mutations.
- Ensure full localization support (English/Indonesian) for the text displayed in the confirmation dialogs.

**Non-Goals:**
- Creating a global programmatic context for alert dialogs (such as `useConfirm`). We will use local component-based states for now to avoid cross-cutting integration bugs and keep changes simple and isolated.
- Changing delete endpoints or schema definitions on the backend.

## Decisions

### 1. State-Controlled AlertDialog vs. Reusable Hook
We will use localized component state inside `ScopingPage.tsx` (`deleteSimId` and `deleteSnapId`) to manage the open/close state of the dialogs.
*   **Alternatives Considered:** Reusable `useConfirm` context.
*   **Rationale:** While a context is more elegant, localized React state is simpler, easier to test, and contains fewer integration risks with TanStack Query and state synchronization.

### 2. Localization Keys
We will add standard confirmation strings to `locales/en/scoping.json` and `locales/id/scoping.json` for scoping-specific items, and reuse common actions like "Cancel" and "Delete" from `common.json`.
*   **Rationale:** Keeps translation catalogs clean and structured.

## Risks / Trade-offs

- **[Risk] State Desynchronization**: If the mutation completes or fails, the state of the dialog must be cleaned up properly.
  - *Mitigation*: Reset the target IDs (`deleteSimId` / `deleteSnapId`) to `null` immediately when the mutation is called or when the user cancels.
