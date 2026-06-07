## Context

The IndoGRC Pro platform is pivoting its demo focus from Mining to Banking. Currently, the `AIAnalyticsMockup` component and its supporting data (`ai-mock-data.ts`) are hardcoded with mining-specific scenarios (e.g., Weighbridge calibration, PKP2B contracts). Furthermore, the company name is hardcoded in the UI instead of being fetched from the system settings established in the `organization` table.

## Goals / Non-Goals

**Goals:**
- Centralize organization branding (Name/Logo) so it reflects values set in `/settings`.
- Implement a complete set of banking-specific AI use cases: AML, Loan Review, Predictive Credit Risk, and Suspense Account Monitoring.
- Update all Recharts visualizations to reflect banking KPIs (CASA vs Loans, NPL Ratios).
- Update the Agentic Assistant's context injection to include the organization's industry cluster.

**Non-Goals:**
- Actual implementation of live ML models for banking (this remains a mockup/POC phase).
- Modification of the core RCM/Scoping logic (only the AI representation layer is affected).

## Decisions

- **Domain-Specific Mock Data (`shared/ai-banking-data.ts`)**: We will create a new file for banking mock data rather than overwriting the mining data. This allows for future "Cluster Switching" capabilities.
- **Organization branding hook**: We will implement a `useOrganizationBranding` hook that wraps the `/api/settings` query to provide `companyName` and `logoUrl` to various mockup components.
- **Reuse of Visualization Components**: We will keep the existing Recharts structures (Radar, Area, Bar, Scatter) but update their labels, color schemes, and data feeds to match banking semantics.

## Risks / Trade-offs

- **[Risk]** Data mismatch between visual charts and discovery logs.
  - **Mitigation**: Ensure each use case in `shared/ai-banking-data.ts` contains a single source of truth for both the `chart` data and the `findings` array.
- **[Risk]** Hardcoded mining references remaining in legacy CSS classes or utility functions.
  - **Mitigation**: Perform a global search for "Batubara" and "Mining" within the `reports` directory during implementation.
