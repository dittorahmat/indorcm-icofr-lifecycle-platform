## Context

In `DeficiencyBoard.tsx`, saving an `ActionPlan` triggers `planMutation`. In the `onSuccess` callback of `planMutation`, `setRemediationOpen(false)` is currently called, closing the modal immediately. 

In addition, `RemediationForm.tsx` manages a React Hook Form instance. When the user modifies form fields, `form.formState.isDirty` becomes `true`. The right-side `WorkflowPanel` checks `isDirty` and blocks actions (showing a warning toast: "Unsaved changes") if the form is dirty. When `onSubmit` is called in `RemediationForm.tsx`, `form.reset(values)` is not explicitly called upon mutation success, leaving `isDirty` true or causing state desynchronization if the modal stays open.

## Goals / Non-Goals

**Goals:**
- Keep the `RemediationForm` modal open after clicking "Save Remediation Plan".
- Reset the React Hook Form `isDirty` state upon successful save so workflow actions (like `Submit` or `Bypass & Finalize Approval`) can be executed immediately without triggering an unsaved changes warning.
- Update dialog controls so users can explicitly close the modal when finished.

**Non-Goals:**
- Redesigning the entire `WorkflowPanel` or changing approval status state machines.

## Decisions

1. **Keep Modal Open in `DeficiencyBoard.tsx`:**
   - Remove `setRemediationOpen(false)` from `planMutation.onSuccess`.
   - Optionally pass an `onSuccess` callback to `onSubmit` prop or handle form state reset inside `RemediationForm.tsx`.

2. **Form Reset in `RemediationForm.tsx`:**
   - Call `form.reset(form.getValues())` inside `RemediationForm` after successful save mutation (or when `actionPlan` prop updates), ensuring `isDirty` is set to `false`.

3. **Dialog Footer Action Updates:**
   - Maintain a clear "Close" or "Done" button alongside "Save Remediation Plan" so users have a clean exit path.

## Risks / Trade-offs

- **[Risk]** User edits fields, clicks a Workflow action directly without saving first.
- **[Mitigation]** The `WorkflowPanel` will still correctly warn about unsaved changes if `isDirty` is true before Save is clicked, guiding the user to save first.
