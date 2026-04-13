## 1. Data Model & Backend Entities

- [x] 1.1 Update `User` type in `shared/types.ts` with `departmentId` and `level` (Staff/Manager).
- [x] 1.2 Add `Department` entity in `shared/types.ts`.
- [x] 1.3 Add `assignedDepartmentId` and `bpmStatus` to `Control` and `SignificantAccount` in `shared/types.ts`.
- [x] 1.4 Implement `DepartmentEntity` in `worker/entities.ts`.
- [x] 1.5 Update `UserEntity` and `ControlEntity` to handle new fields in `worker/entities.ts`.
- [x] 1.6 Add seed data for Departments and structured Lini 1 Users in `shared/mock-data.ts`.

## 2. API Routes & Workflow Logic

- [x] 2.1 Add `/api/departments` routes (list, create) in `worker/user-routes.ts`.
- [x] 2.2 Add `/api/scoping/assign-department` route for Account Assignment.
- [x] 2.3 Update `/api/controls/:id/bpm-update` to handle `Draft` status and departmental access validation.
- [x] 2.4 Add `/api/controls/:id/approve` and `/api/controls/:id/reject` routes with automated `ChangeLog` generation.
- [x] 2.5 Update authentication middleware to inject `departmentId` and `level` into the context.

## 3. Scoping Grid & Account Assignment UI

- [x] 3.1 Update `GLDataGrid.tsx` to include a "Department Owner" column.
- [x] 3.2 Implement `DepartmentPicker` component for assigning accounts to departments.
- [x] 3.3 Add locks/visual indicators on BPM links based on `currentUser.departmentId`.
- [x] 3.4 Update Excel export in `GLDataGrid.tsx` to include department ownership info.

## 4. Integrated BPM Modal

- [x] 4.1 Create `BPMModal.tsx` as a shared component (re-using logic from `BPMWorksheet.tsx`).
- [x] 4.2 Add Tabs to `BPMModal`: `Worksheet`, `Diagram Flow`, and `Audit Log`.
- [x] 4.3 Implement "Submit for Approval" button for Staff and "Approve/Reject" for Manager.
- [x] 4.4 Update `BPMPage.tsx` to trigger `BPMModal` instead of inline worksheet.
- [x] 4.5 Move "BPM Workflow" button in `BPMPage` to the left (after No column).

## 5. Regulatory Reporting & PDF Export

- [x] 5.1 Implement PDF generation for Lampiran 4 using `react-to-print` or `jspdf`.
- [x] 5.2 Create `Lampiran6LogView` to display change history within the BPM Modal.
- [x] 5.3 Add "Print Lampiran 4" button to the `BPMModal` header.

## 6. Cleanup & Validation

- [x] 6.1 Mark `/rcm` routes as deprecated and remove links from Sidebar.
- [x] 6.2 Perform end-to-end testing of the Staff-input/Manager-approval flow.
- [x] 6.3 Verify PDF output matches Lampiran 4 formatting in SK-5/2024.
