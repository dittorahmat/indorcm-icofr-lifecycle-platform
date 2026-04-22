## Context

The application currently relies on user diligence to save changes. There is no mechanism to prevent accidental data loss during navigation (internal or external). React Router 6.4+ (used in this project) provides `useBlocker` for internal navigation, and the web standard `beforeunload` event handles external navigation.

## Goals / Non-Goals

**Goals:**
- Provide a consistent way to track "dirty" state across different types of components (forms, canvas editors, custom grids).
- Show a user-friendly confirmation dialog for internal navigation.
- Trigger browser-native warnings for tab close/refresh.
- Implement a reusable hook `useUnsavedChanges` that abstracts both layers.

**Non-Goals:**
- Automatic background saving (autosave).
- Recovering lost data after the browser has already closed.
- Detecting changes that don't affect the data model (e.g., UI toggle states).

## Decisions

### 1. Unified `useUnsavedChanges` Hook
- **Decision**: Create a single hook that accepts a boolean `isDirty`.
- **Rationale**: Keeps the implementation simple for developers. One line of code in any component can protect the data.
- **Alternatives**: Separate hooks for browser vs router, but that leads to duplication and inconsistent behavior.

### 2. Internal Navigation with `useBlocker`
- **Decision**: Use React Router's `useBlocker` hook.
- **Rationale**: It's the native way to intercept transitions in React Router 6. It allows us to show a custom React component (Shadcn AlertDialog) instead of a browser prompt.

### 3. External Navigation with `beforeunload`
- **Decision**: Use `window.addEventListener('beforeunload', ...)` inside the same hook.
- **Rationale**: This is the only way to catch tab closures and refreshes. Browser security prevents custom dialogs here, so we must use the native prompt.

### 4. Custom `UnsavedChangesDialog` Component
- **Decision**: Create a reusable `AlertDialog` wrapper for the internal blocker.
- **Rationale**: Ensures a consistent look and feel across the application.

## Risks / Trade-offs

- **[Risk]** → `useBlocker` only works with the new `createBrowserRouter` (which we are using). If navigation is done via `window.location`, it won't be caught.
- **[Mitigation]** → Standardize all navigation to use `Link` or `useNavigate`.
- **[Risk]** → Users might find the warnings annoying for minor changes.
- **[Mitigation]** → Only set `isDirty` when meaningful data has changed.
- **[Risk]** → React Router 6.4 `useBlocker` can be complex to integrate with some navigation patterns.
- **[Mitigation]** → Test thoroughly with sidebar navigation and browser back/forward.
