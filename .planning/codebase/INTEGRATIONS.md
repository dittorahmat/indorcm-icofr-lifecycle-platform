# Integrations - IndoGRC Pro (ICOFR Lifecycle Platform)

Overview of external APIs, libraries, and internal service connections.

## Internal Service Connections
- **Frontend-to-Backend**: 
  - Standardized `api` utility in `src/lib/api-client.ts`.
  - All communication happens over HTTPS via the `/api/*` endpoint.
  - Integration with Cloudflare Workers via Hono routes defined in `worker/user-routes.ts`.
- **Durable Objects Architecture**:
  - Entities (RCM, Control, Deficiency, etc.) are managed by specific Durable Object classes (`RCMEntity`, `ControlEntity`, etc.).
  - Cross-entity relationships and audit trails are handled within the worker layer.

## External Libraries & Processing
- **File Processing**:
  - [XLSX (SheetJS)](https://sheetjs.com/): For reading and writing Microsoft Excel files.
  - [PapaParse](https://www.papaparse.com/): Fast CSV parser for browser and worker environments.
- **Iconography**:
  - [Lucide React](https://lucide.dev/): Provides a consistent set of vector icons.
- **Mocking & Development**:
  - `X-Mock-Role` Header: Used for simulating different user roles (e.g., 'Line 1', 'External Auditor') during development and demo.
  - Seed Data: Initial application state populated from `shared/mock-data.ts`.

## External APIs
- **Cloudflare API**:
  - Integration via the `cloudflare` package (v5.0.0) for potential infrastructure management within the application context.
- **Error Reporting**:
  - Custom `/api/client-errors` endpoint for capturing and logging frontend crashes and React Error Boundary events to the backend log.

## Platform Features
- **ITGC & SOC Review**:
  - Managed via `SOCReportEntity` for tracking vendor compliance reports.
- **Process Flow Management**:
  - `BPMEditor` (using `React Flow`) for visual representation of business processes.
- **Compliance Dashboarding**:
  - Integrated charts using `Recharts` for real-time visualization of ICOFR status, materiality, and deficiency board.
