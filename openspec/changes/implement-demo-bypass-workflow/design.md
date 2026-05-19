## Context

The ICOFR application follows a multi-stage approval process (Lini 1 -> Lini 2 -> Auditor) for key regulatory documents. While necessary for production, this workflow creates friction during demo sessions where a single presenter needs to demonstrate the final output quickly.

## Goals / Non-Goals

**Goals:**
- Provide a simple toggle to bypass the multi-stage approval.
- Ensure the bypass button triggers the existing `onApprove` logic to maintain data integrity.
- Minimize code changes by centralizing the bypass logic in `WorkflowPanel.tsx`.

**Non-Goals:**
- Removing the approval logic entirely (it must remain available for non-demo environments).
- Changing the backend data model (we use existing API actions).

## Decisions

### 1. Environment Variable Control
**Decision:** Use `import.meta.env.VITE_ENABLE_WORKFLOW_APPROVAL` to control the bypass mode.
**Rationale:** Environment variables allow for easy configuration across different deployment environments (Demo, Staging, Production) without code modifications.
**Alternative:** A setting in the database. *Rejected* because env vars are more immediate and don't require database migrations.

### 2. Bypass Button UI in WorkflowPanel
**Decision:** Replace the standard multi-button workflow (Review, Request, etc.) with a single "Bypass Approval" button when `VITE_ENABLE_WORKFLOW_APPROVAL === 'false'`.
**Rationale:** Simplifies the UI for the presenter and ensures they don't accidentally click the "wrong" stage button.
**Alternative:** Just showing all buttons and making them all work. *Rejected* because it's confusing for a demo.

### 3. Visual Styling for Demo Mode
**Decision:** Use a `Warning` style banner (Amber background) in the `WorkflowPanel` to clearly indicate that Demo Mode is active.
**Rationale:** Prevents confusion if a developer accidentally leaves the bypass mode enabled in a non-demo environment.

## Risks / Trade-offs

- **Risk:** Accidental bypass in production if the env var is misconfigured.
- **Mitigation:** Default the variable to `true` (enabled) and use a distinct visual indicator when it's `false` (bypassed).
