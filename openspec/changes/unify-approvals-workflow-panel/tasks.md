## 1. Types and Blueprint Extensions

- [x] 1.1 Update WorkflowPanelProps entityType and useWorkflow to include RCM_CHANGE and CSA, and verify TypeScript type checking passes.
- [x] 1.2 Add RCM_CHANGE and CSA configurations to WORKFLOW_BLUEPRINTS in src/components/workflow/WorkflowPanel.tsx with appropriate action labels and transitions.
- [x] 1.3 Add i18n localization keys in src/i18n/locales/en/workflow.json and id/workflow.json for any new workflow actions.

## 2. Backend Workflow Handlers

- [x] 2.1 Add POST /api/rcm/:id/workflow endpoint in worker/routes/rcm.ts to handle Submit, Review, Approve (with change log recording), Reject, and Rollback.
- [x] 2.2 Add POST /api/csa/:id/workflow endpoint in worker/routes/csa.ts to support multi-stage lifecycle, auto-deficiency trigger on Ineffective results, and audit trail.
- [x] 2.3 Verify database models in worker/db/schema.ts have workflowStatus and workflowHistory columns for RCM changes and CSA, executing npx drizzle-kit push if updated.

## 3. Frontend Integration

- [x] 3.1 Integrate WorkflowPanel into RCM Change Management modal/views in src/pages/rcm/.
- [x] 3.2 Integrate WorkflowPanel into CSA assessment worksheet in src/pages/csa/.
- [x] 3.3 Test Demo Mode bypass (VITE_ENABLE_WORKFLOW_APPROVAL=false) across both RCM Change and CSA workflows to verify instant approval works.

## 4. Verification and Testing

- [x] 4.1 Run npm run type-check to verify no type regressions.
- [x] 4.2 Run npm run lint to ensure adherence to code standards.
- [x] 4.3 Run npm run build and npm test to ensure successful compilation and passing tests.
