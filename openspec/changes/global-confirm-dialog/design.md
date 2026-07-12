## Context

Using native browser alerts looks unprofessional in a modern React application. We will introduce a global context-based programmatic alert system.

## Goals / Non-Goals

**Goals:**
- Implement a React Context-based `ConfirmProvider` and a `useConfirm` hook.
- The hook will return a `confirm` function returning a Promise: `const isConfirmed = await confirm({ title, description })`.
- Standardize all delete confirmations and general confirms to use this hook.

**Non-Goals:**
- Replacing alerts or toasts; this is strictly for confirmation prompts that require action (Yes/No).

## Decisions

### 1. Programmatic Confirm Dialogue via State Queue
To display the dialog dynamically, `ConfirmProvider` will maintain a localized state of the current prompt (`{ title, description, resolve, reject, isOpen }`).
When `confirm()` is called, it will generate a new Promise and store its `resolve` resolver in the provider's state, setting `isOpen` to `true`.
*   **Rationale:** Avoids rendering `<AlertDialog>` manually in each component, keeping the JSX clean.

```tsx
export interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}
```

## Risks / Trade-offs

- **[Risk] Multiple Dialogs at Once**: If two confirms are triggered in quick succession, one may override the other.
  - *Mitigation*: In our application, confirms are only triggered by user interactions (clicks), so concurrent confirmations are highly unlikely.
