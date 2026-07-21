## 1. Database & Backend Setup

- [x] 1.1 Add `user_preferences` schema to database schemas with a `jsonb` column for dashboard layouts.
- [x] 1.2 Generate and run database migrations using Drizzle Kit (`npx drizzle-kit generate` and `npx drizzle-kit push`).
- [x] 1.3 Implement `GET /api/user/preferences` and `PUT /api/user/preferences` endpoints in the Hono Workers service.
- [x] 1.4 Add unit tests for backend preferences API routes.

## 2. Frontend Setup & State

- [x] 2.1 Add `react-grid-layout` and `@types/react-grid-layout` dependencies to package.json.
- [x] 2.2 Import grid layout standard stylesheets in `src/index.css`.
- [x] 2.3 Implement TanStack Query hooks `useUserPreferences` (fetching) and `useSaveUserPreferences` (updating) with a 2-second debounce timer.

## 3. Sidebar Catalog & Widget Integration

- [x] 3.1 Design a collapsible widget catalog library sidebar allowing users to toggle widgets on and off.
- [x] 3.2 Integrate `RiskHeatmap`, `COSOHeatmap`, and other core visual widgets into the customizable grid workspace.
- [x] 3.3 Add the "Reset Layout" capability that triggers backend deletion and updates frontend state with defaults.

## 4. Dashboard Integration & Verification

- [x] 4.1 Refactor `src/pages/reports/ReportsPage.tsx` overview section to render the new customizable workspace.
- [x] 4.2 Validate full localization of all new interface labels using `useTranslation`.
- [x] 4.3 Verify system compilation and integrity by running `npm run type-check`, `npm run lint`, and `npm run build`.

## 5. Self-Service BI Configurer

- [x] 5.1 Add settings gear icon to each widget header.
- [x] 5.2 Implement settings popover/dialog inside widget headers supporting custom title, metric data source, and chart type.
- [x] 5.3 Implement dynamic visualization rendering engine mapping chosen data metrics to chosen chart styles (bar, pie/donut, heatmap, KPI cards).
- [x] 5.4 Add unit/integration verification, localization, and full system compilation checks.
