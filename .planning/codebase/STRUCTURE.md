# IndoGRC Pro Project Structure

This document provides a directory-by-directory breakdown and key file responsibilities for the IndoGRC-ICOFR-Lifecycle-Platform.

## Project Root

- `.planning/`: Documentation, conventions, and architectural records.
- `shared/`: Shared types and mock data between frontend and backend.
- `src/`: Frontend React application.
- `worker/`: Backend Cloudflare Worker (Hono app).
- `public/`: Static assets for the frontend.
- `dist/`: Build artifacts (generated after running `bun run build`).
- `wrangler.jsonc`: Cloudflare Workers configuration (DO NOT MODIFY).
- `package.json`: Project dependencies and scripts.
- `bun.lock`: Bun lockfile.
- `tsconfig.json`: Global TypeScript configuration.

## `worker/` (Backend)

- `index.ts`: The main entry point for the Hono worker. Sets up CORS, logging, and middleware.
- `user-routes.ts`: Defines all API endpoints for the application (RCM, Controls, etc.).
- `core-utils.ts`: Core framework for entity management and Durable Object storage (STRICTLY DO NOT MODIFY).
- `entities.ts`: Domain-specific entity classes inheriting from `IndexedEntity`.
- `csv.ts`: Utilities for parsing and generating CSV data for import/export.
- `types.d.ts`: TypeScript definitions for worker environment and bindings.

## `src/` (Frontend)

- `main.tsx`: Entry point for the React app. Sets up routing (`react-router-dom`) and TanStack Query.
- `index.css`: Global styles using Tailwind CSS.
- `App.css`: App-specific styling.

### `src/components/`
- `ui/`: Reusable primitive components (Button, Input, Table, etc.) based on Radix UI.
- `layout/`: Main layout structures (`RootLayout`, `MainHeader`).
- `rcm/`: Feature components for RCM management (BPM Editor, Control Editor).
- `scoping/`: Components for materiality and scoping (GL Data Intake).
- `deficiencies/`: Components for deficiency tracking and wizards.
- `dashboard/`: Compliance charts and reporting widgets.

### `src/pages/`
- `HomePage.tsx`: Landing page with overview.
- `Dashboard.tsx`: High-level compliance status dashboard.
- `rcm/`: Pages for RCM list, change logs, and SOC monitoring.
- `scoping/`: Scoping analysis pages.
- `csa/`: Control Self-Assessment (CSA) workspace.
- `testing/`: Test of Design (TOD) and Test of Operating Effectiveness (TOE) workbench.
- `deficiencies/`: Deficiency board and action plan management.
- `reports/`: Compliance reporting and summary pages.

### `src/lib/`
- `api-client.ts`: Wrapper for `fetch` that handles headers and standardized API responses.
- `utils.ts`: General-purpose utility functions (e.g., class name merging).
- `compliance-utils.ts`: Specialized utilities for compliance logic.
- `errorReporter.ts`: Logic for reporting client-side errors to the backend.

### `src/hooks/`
- `use-theme.ts`: Hook for managing theme state.
- `use-mobile.tsx`: Hook for detecting mobile viewport.

## `shared/` (Shared Layer)

- `types.ts`: Comprehensive TypeScript interfaces for all domain entities and API contracts.
- `mock-data.ts`: Initial seed data used for development and demonstration.
