# Technology Stack - IndoRCM Pro (ICOFR Lifecycle Platform)

Detailed breakdown of the technologies used in the IndoRCM Pro project.

## Frontend
- **Framework**: [React](https://react.dev/) (v18.3.1)
- **Build Tool**: [Vite](https://vitejs.dev/) (v6.3.1)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5.8)
- **Styling**: 
  - [Tailwind CSS](https://tailwindcss.com/) (v3.4.17)
  - [PostCSS](https://postcss.org/) & [Autoprefixer](https://github.com/postcss/autoprefixer)
  - [shadcn/ui](https://ui.shadcn.com/) (Component primitives from Radix UI)
  - [Lucide React](https://lucide.dev/) (Icon library)
  - [Framer Motion](https://www.framer.com/motion/) (Animations)
- **State Management**:
  - [Zustand](https://zustand-demo.pmnd.rs/) (v5.0.6) - Global client state
  - [React Query (@tanstack/react-query)](https://tanstack.com/query/latest) (v5.83.0) - Server state & caching
- **Routing**: [React Router DOM](https://reactrouter.com/) (v6.30.0)
- **Forms & Validation**:
  - [React Hook Form](https://react-hook-form.com/) (v7.60.0)
  - [Zod](https://zod.dev/) (v4.0.5) - Schema validation
- **Data Visualization & Interaction**:
  - [Recharts](https://recharts.org/) (v2.15.4) - Business charts
  - [React Flow](https://reactflow.dev/) (v11.11.4) - Process flow diagrams
  - [@dnd-kit](https://dndkit.com/) - Drag and drop functionality
- **Utilities**:
  - `date-fns` - Date manipulation
  - `clsx` & `tailwind-merge` - Dynamic class composition
  - `immer` - Immutable state management helper
  - `uuid` - Unique ID generation

## Backend
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Framework**: [Hono](https://hono.dev/) (v4.8.5) - Ultra-fast web framework for Edge
- **Language**: TypeScript
- **Logging**: [Pino](https://getpino.io/) (v9.11.0)
- **API Strategy**: RESTful API hosted on `/api/*` prefix

## Database & Storage
- **Primary Database**: [Cloudflare Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/) with **SQLite** backend (`new_sqlite_classes`).
- **Data Model**: `IndexedEntity` abstraction layer (defined in `worker/core-utils.ts`) for managing entities in Durable Objects.
- **Persistence**: Managed via Cloudflare's distributed state system.

## Infrastructure & DevOps
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/) / [Workers](https://workers.cloudflare.com/)
- **Configuration**: `wrangler.jsonc` (Cloudflare configuration)
- **Deployment Tool**: [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Linting & Formatting**: 
  - [ESLint](https://eslint.org/) (v9.31.0)
  - [TypeScript ESLint](https://typescript-eslint.io/)
- **Observability**: Cloudflare Observability (integrated logging and monitoring)
