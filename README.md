# IndoRCM Pro — ICOFR Lifecycle Platform
IndoRCM Pro is a production-grade web application that digitizes the ICOFR (Internal Control over Financial Reporting) lifecycle for BUMN (State-Owned Enterprises). It streamlines compliance with Regulation SK-5/DKU.MBU/11/2024 by providing a standardized, transparent, and auditable platform covering the entire process—from planning and scoping to reporting. Built with a focus on visual excellence and enterprise readiness, the app features a stunning, minimal UX with strict Role-Based Access Control (RBAC) aligned to the Three Lines Model, comprehensive audit trails, and seamless export capabilities.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dittorahmat/indorcm-icofr-lifecycle-platform)
## Overview
IndoRCM Pro enables efficient management of internal controls based on COSO 2013 and COBIT 2019 frameworks. It centralizes Risk Control Matrices (RCM), testing workflows, remediation tracking, and reporting to reduce manual effort and enhance visibility for executives.
Key UI surfaces include:
- **Home (Hero)**: Engaging entry point with mission overview and quick access.
- **Dashboard**: Executive KPIs, timelines, and shortcuts.
- **RCM Manager**: Searchable repository for processes and controls.
- **CSA Workspace**: Self-assessment tools for process owners.
- **Testing Workbench**: TOD/TOE modules for internal audit.
- **Deficiency Board**: Kanban-style remediation tracking.
- **Reports & Exports**: Summaries and downloadable formats (CSV/Excel/PDF).
The backend uses Durable Objects for persistent storage of entities like Accounts, RCMs, Controls, CSA Records, Test Records, Deficiencies, and Action Plans. Frontend interactions occur via `/api/*` endpoints, ensuring end-to-end type safety and real-time updates.
## Features
- **Full ICOFR Lifecycle Support**: Planning, documentation, evaluation (CSA/TOD/TOE), remediation, and reporting.
- **Strict RBAC**: Role-based access for Line 1 (Process Owners), Line 2 (ICOFR Officers), Line 3 (Internal Audit), and executives.
- **Interactive Workflows**: Evidence uploads, sampling tools, auto-deficiency generation, and status transitions.
- **Visual Excellence**: Responsive design with smooth animations, micro-interactions, and professional-grade polish using ShadCN/UI.
- **Data Management**: Bulk imports via CSV/Excel, seeded mock data for demos, and export capabilities.
- **Audit-Friendly**: Timestamps, history tracking, and compliance reports.
- **Edge-Optimized**: Deployed on Cloudflare Workers for low-latency, global performance.
## Resolved Issues
Critical runtime errors (invalid hook calls, Vite dependency chunk issues, server restarts) have been fixed for stable preview and deployment. The preview URL now correctly reflects the IndoRCM Pro branding.
## Technology Stack
### Frontend
- **Framework**: React 18+ with Vite for fast development and builds.
- **Routing**: React Router 6.
- **State Management**: TanStack Query for data fetching and caching; Zustand for local state.
- **Forms & Validation**: React Hook Form + Zod.
- **UI Components**: ShadCN/UI (built on Radix UI primitives) + Tailwind CSS v3 for styling.
- **Animations**: Framer Motion for micro-interactions.
- **Charts**: Recharts for dashboards and reports.
- **Other**: Lucide React (icons), Sonner (toasts), React Dropzone (file uploads).
### Backend
- **Server**: Hono for lightweight API routing.
- **Persistence**: Cloudflare Durable Objects with IndexedEntity pattern for entities; SQLite (via LibSQL/Turso) ready for scaling.
- **ORM**: Drizzle ORM (prepared for production migration).
- **API**: RESTful endpoints with type-safe responses; future tRPC support.
- **Validation**: Zod for schemas.
### Tools & Deployment
- **Package Manager**: Bun for fast installs and scripting.
- **TypeScript**: Strict typing across frontend and backend.
- **Deployment**: Cloudflare Workers for edge computing; Wrangler CLI for management.
- **Auth**: Better Auth (integrated for secure sessions and RBAC).
## Quick Start
To get started instantly, deploy this project to Cloudflare Workers:
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dittorahmat/indorcm-icofr-lifecycle-platform)
## Installation
1. **Prerequisites**:
   - Node.js 18+ (or Bun for optimal performance).
   - Cloudflare account and Wrangler CLI installed (`bun add -g wrangler`).
2. **Clone and Install**:
   ```bash
   git clone <your-repo-url>
   cd indorcm-pro
   bun install
   ```
3. **Environment Setup**:
   - Copy `.env.example` to `.env` if provided, or configure via Wrangler secrets.
   - Run `bun cf-typegen` to generate Worker types.
## Development
1. **Start the Dev Server**:
   ```bash
   bun dev
   ```
   - Opens at `http://localhost:3000`.
   - Hot-reloads frontend changes.
   - Worker APIs available at `/api/*`.
2. **Backend Development**:
   - Add routes in `worker/user-routes.ts` using the IndexedEntity pattern.
   - Define entities in `worker/entities.ts` (extend `IndexedEntity`).
   - Seed data via `ensureSeed` for mock RCM/CSA entries.
3. **Frontend Development**:
   - Pages in `src/pages/` (e.g., update `HomePage.tsx` for custom home).
   - Use TanStack Query for API calls: `useQuery({ queryKey: ['rcm'], queryFn: () => api('/api/rcm') })`.
   - Forms: Integrate with `useForm` from React Hook Form + Zod resolver.
   - Styling: Tailwind-safe utilities; ShadCN components from `@/components/ui/*`.
4. **Testing Locally**:
   - Preview build: `bun preview`.
   - Lint: `bun lint`.
   - Type check: `bun tsc --noEmit`.
Example API Usage (Frontend):
```tsx
import { api } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
const { data: rcms } = useQuery({
  queryKey: ['rcms'],
  queryFn: () => api<{ items: RCM[] }>('/api/rcm'),
});
```
## Deployment
Deploy to Cloudflare Workers for production:
1. **Build and Deploy**:
   ```bash
   bun build  # Builds frontend assets
   bun deploy # Deploys Worker via Wrangler
   ```
2. **Configure Bindings**:
   - Durable Objects are pre-bound in `wrangler.jsonc` (do not modify).
   - Add custom secrets: `wrangler secret put <KEY>`.
3. **Instant Deployment**:
   Use the button below to deploy directly from this repository:
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dittorahmat/indorcm-icofr-lifecycle-platform)
4. **Post-Deployment**:
   - Access at `<your-worker>.workers.dev`.
   - Monitor via Cloudflare Dashboard (logs, metrics).
   - Scale to PostgreSQL by updating entities to use Drizzle ORM.
## Usage
- **RBAC Demo**: Mock roles via headers; extend with Better Auth for production.
- **Bulk Import**: POST CSV to `/api/import/rcm` with Zod validation.
- **Exports**: GET `/api/reports/export?format=pdf` streams responses.
- **Mobile-Responsive**: Tested across devices; uses Tailwind breakpoints.
For ICOFR workflows:
1. ICOFR Officer scopes accounts and builds RCM.
2. Assign to Process Owners for CSA.
3. Audit performs TOD/TOE, creating deficiencies.
4. Track remediation in Deficiency Board.
5. Generate reports for CFO sign-off.
## Contributing
Contributions welcome! Fork the repo, create a feature branch, and submit a PR. Focus on:
- Enhancing RBAC enforcement.
- Adding ERP integration hooks.
- Improving accessibility and performance.
Follow the implementation roadmap in the blueprint for phased development.
## License
MIT License. See [LICENSE](LICENSE) for details.
## Support
For issues, open a GitHub issue. For enterprise support, contact Cloudflare or the project maintainers.