## Context

Refer to `proposal.md` for motivation. Currently, `DeficiencyService.createAutoDeficiency()` creates a draft `action_plans` without `dueDate` or `targetDate`, causing \"1/1/1970\" display in `DeficiencyCard.tsx`. In addition, auditors can still attempt to test (TOE) ineffective controls in `TestWorkbench.tsx`, contrary to SK-5 BAB V Hal. 54 point 3.

## Goals / Non-Goals

*Goals:*
- Ensure default due date of 31 December (year-end cut-off) during auto-deficiency creation.
- Implement a robust date guard in `DeficiencyCard.tsx` to prevent epoch display and erroneous overdue styling.
- Introduce an audit testing gatekeeper in `TestWorkbench.tsx` to freeze TEE testing on ineffective controls until resolved.
- Rename button label "Edit Plan" to "Action Plan" with full i18n support.

*Non-Goals:*
- Rewriting the Kanban drag-and-drop engine or changing the deficiency workflow states beyond this lifecycle.

## Decisions

### 1. Year-End Fallback vs Null Date
- Decision: Set `dueDate` and `targetDate` to December 31st of the current fiscal year at the moment of auto-creation.
- Rationale: SK-5/2024 requires all deficiencies to be completed and retested before the financial reporting cut-off (31 December). This provides an auditable, realistic default while allowing Lini 1 to adjust it earlier via the Action Plan form.
- Alternatives: Leaving it null requires users to manually input a date before submission, but leads to 1970 display glitches and unscheduled items in TodoListPage.

3## 2. Audit Gatekeeper Iplementation
- Decision: In `TestWorkbench.tsx`, leverage the existing `deficiencies` query. If a control has an open deficiency from CSA where the resolution is not "resolved", disable the "Test Control" action and show a Warning Banner quoting SK-5 BAB V Hal. 54.
- Rationale: Minimizes extra API overhead by reusing local state while strictly enforcing the regulatory sequence. 

### 3. Terminology Unification
- Decision: Rename "Edit Plan" to "Action Plan" in `DeficiencyBoard.tsx`, with ``deficiency:actions.actionPlan`` i18n key.
- Rationale: "Edit Plan" implies modifying an existing thing, whereas for a freshly ineffective control, Lini 1 is actually formulating the action plan for the first time.


## Risks / Trade-offs

- [Old Data Risk]: Existing data in database might still have `null` dueDates.  Mitigation: `DeficiencyCard.tsx` will include a frontend safety fallback so any legacy null records also display 31 December instead of 1970.
- [Auditor Blocking]: Auditors might want to preview the design still.  Mitigation: TOD (Test of Design) remains viewable, only TOE (Test of Operating Effectiveness) submission is frozen as per regulation.
