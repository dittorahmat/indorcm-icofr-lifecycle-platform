# IndoRCM Pro Architecture

This document describes the high-level architectural patterns and data flow of the IndoRCM-ICOFR-Lifecycle-Platform.

## High-Level Overview

IndoRCM Pro is a cloud-native application built on a modern serverless stack. It leverages Cloudflare Workers for its backend and a React-based SPA for its frontend.

### Core Stack
- **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Radix UI (shadcn/ui), TanStack Query, Zustand.
- **Backend**: Cloudflare Workers, Hono (Routing), Durable Objects (Stateful storage).
- **Storage**: Durable Object Storage API (persisted as SQLite in the Cloudflare environment).
- **Package Manager**: Bun.

## Backend Architecture

### Hono API
The backend is a Hono application (`worker/index.ts`) that handles API requests, CORS, logging, and routing. It delegates domain logic to `userRoutes`.

### Entity Management System
A custom entity framework is implemented in `worker/core-utils.ts` to provide structured data management on top of Durable Objects:
- **GlobalDurableObject**: A singleton Durable Object class that provides a KV-like storage with Compare-And-Swap (CAS) capabilities for optimistic concurrency control.
- **IndexedEntity**: An abstract base class that provides CRUD operations and automatic indexing for domain entities.
- **Index**: A prefix-based indexing system that allows for efficient listing and pagination of entities.

### Domain Entities
Domain logic is organized around entities defined in `worker/entities.ts`:
- **ICOFR Core**: RCM, Control, CSA, Test, Deficiency, Action Plan.
- **Scoping**: Materiality, Scoping, Application.
- **Audit**: SOC Report, Audit Trail.
- **Collaboration**: User, Chat Board.

## Frontend Architecture

### State Management
- **Server State**: Managed by `@tanstack/react-query` for efficient data fetching, caching, and synchronization with the backend.
- **UI State**: Managed by `zustand` for lightweight global state (e.g., theme, sidebar state).
- **Form State**: Managed by `react-hook-form` with `zod` for validation.

### Component Design
- **Atomic Components**: Located in `src/components/ui`, these are primitive UI elements based on Radix UI.
- **Feature Components**: Organized by domain (e.g., `src/components/rcm`, `src/components/scoping`).
- **Layout Components**: `RootLayout` and `AppLayout` define the application structure.

## Data Flow

1.  **Request**: Frontend makes an HTTP request to `/api/*` via the `api-client`.
2.  **Routing**: Hono receives the request in the Cloudflare Worker.
3.  **Authentication**: Middleware extracts the user role from the `X-Mock-Role` header.
4.  **Processing**: The route handler in `user-routes.ts` instantiates the relevant `IndexedEntity`.
5.  **State Access**: The entity interacts with the `GlobalDurableObject` stub to get/mutate state.
6.  **Concurrency**: Mutations use CAS to ensure no data is lost during concurrent updates.
7.  **Response**: Hono returns a standardized `ApiResponse` (success/data/error).
8.  **Update**: TanStack Query updates the frontend cache, triggering UI re-renders.

## Security & Authentication
Currently, the system uses a mock authentication mechanism via headers for demonstration purposes. Role-based access control (RBAC) is enforced at the API route level (e.g., Line 1 vs Line 2 vs Line 3).
