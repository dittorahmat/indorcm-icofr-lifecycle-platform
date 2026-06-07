## Why

The current AI Analytics Hub is hardcoded with mining-specific data and branding (PT Batubara Nusantara Sejahtera), making it unsuitable for demoing or implementing the platform for the Banking cluster. To provide a relevant experience for BUMN Banks, the AI mockups must pivot to banking-specific use cases (AML, Credit Risk, Transaction Anomalies) and utilize dynamic organization data from system settings.

## What Changes

- **Dynamic Branding**: Replace hardcoded "PT BATUBARA NUSANTARA SEJAHTERA" references in AI mockups with data from the organization settings API.
- **Banking Use Case Transformation**: Refactor the Slide 9 (AI Use Cases) from mining (Weighbridge, PKP2B, Contractors) to banking (Anti-Money Laundering, Loan Contract Review, Suspense Account Monitoring).
- **Banking Analytics Overhaul**: Update Slide 8 (Data Analytics) visualizations to display banking KPIs such as CASA vs Loan growth, NPL (Non-Performing Loan) ratios, and Transaction Variances.
- **Continuous Monitoring Refresh**: Update Slide 10 (CCM) feed to include banking-specific alerts like unauthorized rate overrides, dormant account reactivations, and smurfing transaction patterns.
- **Mock Data Migration**: Shift the source of truth for AI mock data from mining-centric objects to a new banking-centric data structure.

## Capabilities

### New Capabilities
- `banking-ai-use-cases`: Defines the standard library of AI scenarios, metrics, and visualization requirements specifically for the banking sector.

### Modified Capabilities
- `ai-agentic-assistant`: Update requirements to ensure the agentic assistant is aware of banking domain context and can query banking-specific tools/data.

## Impact

- `src/components/reports/AIAnalyticsMockup.tsx`: Complete UI transformation for banking domain.
- `shared/ai-mock-data.ts`: Replacement or expansion to include banking data objects.
- `src/pages/reports/AIHubPage.tsx`: Adjust page-level context.
- `src/components/reports/mock-regulatory-data.ts`: Update shared constants.
