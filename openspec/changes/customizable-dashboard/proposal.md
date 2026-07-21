## Why

Currently, the IndoGRC Pro dashboard displays a static set of reports and metrics. However, different stakeholders in the ICOFR lifecycle (such as Lini 1 Process Owners, Lini 2 Risk Functions, and external KAP auditors) require distinct visual insights at any given time. Providing a customizable dashboard based on React Grid Layout allows users to configure, resize, rearrange, and add/remove dashboard widgets according to their specific compliance monitoring needs. To ensure layout settings are persistent across all devices and sessions, layouts must be stored in the database.

## What Changes

- **Customizable Dashboard Layout**: Implement a drag-and-drop, resizable grid layout system on the main Dashboard / Reports page overview using React-Grid-Layout.
- **Self-Service BI Widget Configurer**: Empower users to click a gear icon on any widget to choose its custom title, its underlying data source (e.g. Risk Heatmap, COSO, Deficiencies), and its visual chart style (Heatmap, Bar, Donut, KPI Card).
- **Dashboard Personalization Control**: Add controls to Save, Reset, and Customize Layout (add/remove widgets).
- **Widget Library**: Introduce a catalog to add widgets to display.
- **Database Layout Persistence**: Store layout coordinates and widget configurations (x, y, w, h, title, dataSource, vizType) in the PostgreSQL database mapped to the authenticated User ID.
- **Backend API Routes**: Expose GET and PUT API endpoints on the Hono Workers service to manage user dashboard preferences.

## Capabilities

### New Capabilities
- `customizable-dashboard`: Self-service BI dashboard workspace supporting drag-and-drop widget layout rearrangement, resizing, and deep configuration of widget titles, data metrics, and visualization chart types with database-level persistence.

## Impact

- **Database**: Requires schema updates (new table or column for user layout JSON data) using Drizzle ORM.
- **Backend API**: New route endpoints in the Cloudflare Workers / Hono routing system (`/api/user/preferences`).
- **Frontend Components**: Modifies `src/pages/reports/ReportsPage.tsx` and dashboard containers. Integrates TanStack Query mutations with debouncing for autosaving layout configurations.
- **Dependencies**: Adds `react-grid-layout` and its TypeScript types to package dependencies.
