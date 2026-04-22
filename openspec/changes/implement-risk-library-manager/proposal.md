## Why

Currently, risk descriptions and assertions are manually entered in the RCM Manager, leading to inconsistency and potential non-compliance with Regulation SK-5/2024 Appendix 2, which prescribes industry-specific risk clusters. A centralized Risk Library Manager will ensure standardized risk identification and mapping across the organization, improving data integrity and regulatory alignment.

## What Changes

- **New Risk Library Management UI**: A dedicated interface for managing the centralized repository of standardized risks.
- **Sidebar Integration**: Addition of the "Risk Library" menu under the RCSA group for easy access.
- **Risk Library CRUD**: Full Create, Read, Update, and Delete capabilities for the Risk Library entires.
- **Enhanced Control Creation**: Integration of the `RiskLibraryLookup` component into the `ControlEditor` to allow selecting from standardized risks instead of manual entry.
- **Database Schema Update**: New `risk_library` table managed via Drizzle migrations.
- **Localization**: Full Indonesian and English support for all new interface elements.

## Capabilities

### New Capabilities
- `risk-library`: Centralized management of standardized risks according to BUMN clusters as per SK-5/2024 Appendix 2.

### Modified Capabilities
- `rcm`: Enhanced risk identification flow within the Risk Control Matrix by integrating the centralized library.

## Impact

- **Backend**: New API endpoints in `worker/user-routes.ts`, schema definition in `worker/db/schema.ts`, and Drizzle migration generation/execution.
- **Frontend**: New page `src/pages/rcm/RiskLibraryPage.tsx`, updated `src/components/app-sidebar.tsx`, and integration in `src/components/rcm/ControlEditor.tsx`.
- **Shared**: Data models in `shared/types.ts`.
- **i18n**: New translation strings in `src/i18n/locales/`.
