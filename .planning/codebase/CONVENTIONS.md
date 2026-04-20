# Coding Conventions - IndoGRC Pro

## Project Context
IndoGRC Pro is a specialized platform for the ICOFR (Internal Control over Financial Reporting) lifecycle, specifically tailored for BUMN (State-Owned Enterprises). It strictly adheres to **Regulation SK-5/DKU.MBU/11/2024**.

## Tech Stack
- **Frontend:** React 18+ (Vite), TypeScript, Tailwind CSS, Shadcn/UI, Framer Motion.
- **Backend:** Hono (Cloudflare Workers), Cloudflare Durable Objects.
- **State Management:** 
  - **Server State:** TanStack Query (`@tanstack/react-query`).
  - **Client State:** Zustand (`zustand`) for global UI state.
- **Form Management:** React Hook Form + Zod for validation.
- **Diagramming:** React Flow for BPM (Business Process Mapping) visualization.
- **Logging:** Pino for structured logging (especially in Worker and Vite).

## Naming Conventions
- **Components & Pages:** PascalCase (e.g., `AppLayout.tsx`, `SOCReviewDialog.tsx`, `Dashboard.tsx`).
- **Hooks:** camelCase with `use` prefix (e.g., `use-mobile.tsx`, `use-theme.ts`).
- **Utilities & Services:** camelCase (e.g., `api-client.ts`, `compliance-utils.ts`).
- **Types:** PascalCase, centralized in `shared/types.ts` for cross-stack compatibility.
- **Directories:** lowercase, kebab-case (e.g., `src/components/audit`, `src/pages/scoping`).

## Architectural Patterns
- **Shared Source of Truth:** `shared/types.ts` is the foundational contract between Frontend and Worker.
- **Feature-Based Organization:** Files are grouped by ICOFR domain (e.g., `scoping`, `rcm`, `audit`, `csa`, `deficiencies`).
- **Compliance-Driven Logic:** Business logic must reside in `src/lib/compliance-utils.ts` and refer to specific Tables/Sections of SK-5 (e.g., Table 22 for Sampling).
- **Atomic UI:** Shadcn/UI components in `src/components/ui` are treated as primitives.
- **Layout Persistence:** `RootLayout.tsx` and `AppLayout.tsx` manage persistent shell elements (Sidebar, Header).

## Coding Standards
- **Type Safety:** 
  - Strict TypeScript. Avoid `any`.
  - Use Zod schemas for both runtime validation and type inference.
- **Regulatory Referencing:** 
  - Comments should reference Regulation SK-5 when implementing formulas (e.g., "Berdasarkan Tabel 25 Hal 104").
- **Auditability:** 
  - Every entity mutation (Control, RCM, Deficiency) must be accompanied by a `ChangeLog` entry (Lampiran 6).
  - Use `auditTrail` fields in data models.
- **React Best Practices:**
  - **No State Setters in Render:** Enforced by custom ESLint rules to prevent infinite loops.
  - **Composition over Inheritance:** Use React's composition patterns for complex dialogs and wizards.
- **Styling:** 
  - Utility-first CSS with Tailwind.
  - Consistent spacing and typography following the established Shadcn/UI theme.
  - Use `cn()` utility for class merging.

## ESLint & Quality Rules
- **Import Aliases:** Always use `@/` for `src/` and `@shared/` for `shared/`.
- **Restricted Syntax:** State setters (e.g., `setItems`) are forbidden in the immediate function body of a component; they must be inside `useEffect` or event handlers.
- **Dependency Tracking:** `vite.config.ts` includes a plugin to clear caches when `package.json` or `bun.lock` changes.
