## Why

When users fill out the **Remediation Action Plan** form in the ICOFR Lifecycle Platform, saving the plan automatically closes the dialog modal. Furthermore, attempting to immediately submit the action plan for approval via the right-hand **Workflow Control** panel results in an "Unsaved Changes" warning because form submission doesn't automatically save or reset the dirty form state. 

This creates friction and a poor UX where users are forced to re-open the dialog after saving to submit it, or are blocked from submitting approval when editing the form.

## What Changes

- Keep the **Remediation Action Plan** modal open after clicking "Save Remediation Plan", while resetting the form's dirty state (`isDirty`) to `false` upon a successful mutation.
- Allow seamless transition from saving form details to executing workflow status transitions (e.g. Submit, Approve) within the same open dialog.
- Provide a clear, explicit "Close" / "Done" action so users can close the modal when finished.

## Capabilities

### New Capabilities
- `remediation-form-workflow`: Seamless save-and-workflow submission flow for remediation action plans without modal auto-close or unsaved changes warnings.

### Modified Capabilities

## Impact

- `src/components/deficiencies/RemediationForm.tsx`
- `src/pages/deficiencies/DeficiencyBoard.tsx`
- `src/components/workflow/WorkflowPanel.tsx`
