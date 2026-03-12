# Phase 4: Deficiency & Reporting - Implementation Plan

## Step 1: Kanban & DoD Board Hardening
- [ ] Refine `DeficiencyBoard.tsx` to ensure `DragEnd` correctly updates both `ActionPlan` and `Deficiency` status.
- [ ] Ensure `DoDWizard.tsx` captures all qualitative factors for severity determination (Lampiran 9).
- [ ] Implement "Remediation Evidence" upload/link field in the Deficiency card.

## Step 2: Automated Appendix 11 Report
- [ ] Update `ReportsPage.tsx` to pull real Company Name, CFO/CEO names from a new `Settings` entity.
- [ ] Implement robust logic for "Kesimpulan Efektivitas" (Effective vs. Not Effective) based on the presence of any "Material Weakness".
- [ ] Ensure the "Rincian Defisiensi" table only shows Significant Deficiencies and Material Weaknesses.

## Step 3: QR Code & Digital Sign-off
- [ ] Implement a `POST /api/reports/sign-off` route that saves the signature timestamp and generates a unique verification hash.
- [ ] Integrate a QR code generation component (e.g., `qrcode.react`) to display the verification link on the printed report.
- [ ] Add a "Locked" UI state that prevents further modifications once the report is signed.

## Step 4: Production-Ready Auth Refactor
- [ ] Implement a simple login simulation that issues a signed JWT (or robust mock token).
- [ ] Update `worker/user-routes.ts` middleware to validate the `Authorization: Bearer` token.
- [ ] Refactor `api-client.ts` to use the stored token instead of `X-Mock-Role`.

## Verification Plan
- [ ] E2E Test: Record Deficiency -> Remediate -> Generate Appendix 11 -> Sign-off -> Verify QR.
- [ ] Print Audit: Verify the PDF output matches Lampiran 11 exactly.
- [ ] Security Check: Ensure Line 1 cannot access the sign-off button or deficiency board.
