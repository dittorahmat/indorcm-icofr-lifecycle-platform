## 1. Setup & Data Foundation

- [x] 1.1 Create `docs/DEMO-BANKING-EVOLUTION.md` containing the presentation structure and architecture diagram.
- [x] 1.2 Create `shared/ai-banking-data.ts` containing mock data for AML, Loan Review, Predictive Credit Risk, and Suspense Account Monitoring.
- [x] 1.3 Define and export the `AIBankingData` structure in `shared/types.ts` to maintain type safety across the new data file.

## 2. Branding & Dynamic Integration

- [x] 2.1 Implement `useOrganizationBranding` hook in `src/hooks/use-organization-branding.ts` to fetch settings from `/api/settings`.
- [x] 2.2 Refactor `src/components/reports/AIAnalyticsMockup.tsx` to remove the hardcoded `MOCK_COMPANY` and use the dynamic company name from the new hook.
- [x] 2.3 Ensure the `PageHeader` in `AIHubPage.tsx` also reflects the dynamic organization branding.

## 3. Analytics & CCM Overhaul

- [x] 3.1 Update `AnalyticsTab` in `AIAnalyticsMockup.tsx` to replace the "Stockpile vs Sales" AreaChart with "CASA Growth vs Loan Disbursement".
- [x] 3.2 Update metrics cards to display "NPL Ratio" and "Suspense Account Aging" instead of "Selisih Timbang" and "Stockpile".
- [x] 3.3 Refactor `CCMTab` alert feed to use banking-specific alerts (e.g., unauthorized rate overrides, dormant account reactivations).

## 4. AI Use Case Pivot

- [x] 4.1 Update the `useCases` array in `AICasesTab` to point to the banking scenarios defined in `shared/ai-banking-data.ts`.
- [x] 4.2 Update `AIDrilldownView` icons and mapping to support banking scenarios (e.g., Radar chart for Loan Portfolio Risk).
- [x] 4.3 Replace all mining-specific terminology (e.g., "Contractors", "Excavator", "PKP2B") with banking terminology in findings tables.

## 5. Verification & Cleanup

- [x] 5.1 Perform a global search for "Batubara" and "Mining" in the `src/components/reports` directory and ensure no hardcoded references remain.
- [x] 5.2 Verify that changing the Company Name in the `/settings` page correctly updates the AI Analytics Hub title.
- [x] 5.3 Ensure the `ai-agentic-assistant` context includes the industry cluster when interacting with users.
