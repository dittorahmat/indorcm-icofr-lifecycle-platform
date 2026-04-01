## Context

The current `ActionPlan` and `Deficiency` entities in `shared/types.ts` are too simplistic for SK-5/2024 compliance. We need to transition from a simple 4-state Kanban board to a more robust workflow that includes regulatory metadata and role-based coordination.

## Goals / Non-Goals

**Goals:**
- Extend `ActionPlan` interface with mandatory regulatory fields.
- Implement a "Design Review" workflow between Lini 1 and Lini 2.
- Support "Year-End Timing" tracking for auditor validation.
- Update `DeficiencyBoard` to handle new statuses like `In Review` and `Rejected`.

**Non-Goals:**
- Integrating with external ticketing systems (Jira/ServiceNow).
- Full audit log implementation (handled by general Durable Object indexed pattern).

## Decisions

### 1. Data Model Extension
We will add the following fields to the `ActionPlan` interface in `shared/types.ts`:
- `relatedFunction`: string (Fungsi Terkait)
- `picName`: string (Penanggung Jawab)
- `planDescription`: string (Deskripsi Rencana)
- `activityDetail`: string (Detail Aktivitas)
- `remediatedControlDescription`: string (Deskripsi Pengendalian setelah Remediasi)
- `targetDate`: number (Target Tanggal)
- `actualCompletionDate`: number?
- `isApprovedByLine2`: boolean
- `isBeforeYearEnd`: boolean (Computed or manually flagged for Appendix 11)

### 2. Workflow Transitions
Update `ActionPlanStatus` to: `["Draft", "In Review", "In Progress", "Resolved", "Verified"]`.
- `Draft` -> `In Review`: Triggered by Lini 1 "Submit".
- `In Review` -> `In Progress`: Triggered by Lini 2 "Approve".
- `In Review` -> `Draft`: Triggered by Lini 2 "Reject" with comments.

### 3. Component Updates
- `DeficiencyBoard.tsx`: Update `KANBAN_COLUMNS` and move logic to handle 5 statuses.
- `DeficiencyCard.tsx`: Display `PIC` and `Function` on the card face for better visibility.
- `RemediationForm`: Create or update form to include Zod validation for mandatory regulatory fields.

## Risks / Trade-offs

- **Risk**: Increased data entry burden for Lini 1.
  - **Mitigation**: Use smart defaults where possible (e.g., auto-filling PIC based on user profile).
- **Risk**: Workflow complexity might confuse users used to the simple board.
  - **Mitigation**: Add clear visual cues (badges) for "Awaiting My Approval" for Lini 2.
