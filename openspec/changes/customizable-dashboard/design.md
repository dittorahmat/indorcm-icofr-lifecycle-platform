## Context

The current ICOFR Dashboard / Report Overview has a static grid layout displaying several predefined compliance reports (e.g., Risk Heatmap, COSO 17 Principles). Users cannot reorganize or toggle specific widgets based on their immediate operational focus. Storing these settings must be persistent across devices and sessions via database storage.

## Goals / Non-Goals

**Goals:**
- Provide a drag-and-drop workspace where users can arrange dashboard widgets.
- Allow users to resize widgets (e.g., expanding the Risk Heatmap to full-width or shrinking the Deficiency Aging chart).
- Provide a Widget Library sidebar to add/remove widgets.
- Store layout configurations in a PostgreSQL database via a secure backend API.
- Implement debounce logic on save triggers to prevent excessive network requests during resize/drag events.

**Non-Goals:**
- Allowing users to share layouts directly with other users via links (layouts are strictly private per user).

## Decisions

### 1. Database Schema (Drizzle ORM)
- **Option Chosen**: Create a new metadata column `dashboard_layout` of type `jsonb` in the existing `users` table or a dedicated `user_preferences` table.
- **Table Definition (Conceptual)**:
  ```typescript
  // In schemas
  export const userPreferences = pgTable('user_preferences', {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    layout: jsonb('layout').$type<LayoutRecord[]>(),
    updatedAt: timestamp('updated_at').defaultNow(),
  });
  ```
- **Rationale**: Keeps preferences clean and separated from core authentication profiles, with automatic cascade deletions.

### 2. API Routes (Hono Workers)
- Expose the following endpoints under auth middleware:
  - `GET /api/user/preferences`: Returns the saved layout preferences. If none exist, returns `null` (frontend defaults to role-based fallback).
  - `PUT /api/user/preferences`: Accepts a JSON payload containing the layout coordinate structures and updates the database row.

### 3. Frontend Debouncing & State Sync (TanStack Query)
- **Mechanism**:
  - Maintain the active layout coordinates in local React state during active drag/resize operations.
  - On layout modification (`onLayoutChange`), trigger a debounced function (e.g., `useDebounce` or lodash-debounce set to 2000ms).
  - Once the user stops moving widgets for 2 seconds, trigger a TanStack Query mutation `useMutation` to send the payload to `PUT /api/user/preferences`.
- **Rationale**: Prevents database write overloading during active drag-and-drop movements.

## Risks / Trade-offs

- **[Risk] High API traffic on continuous dragging**: If debouncing fails, serverless database limits could be exceeded.
  - *Mitigation*: Strictly debounce layout updates by at least 2000ms. Keep coordinate state local until dragging/resizing terminates.
- **[Risk] User role changes**: If a user's role is changed (e.g., Lini 1 to Auditor), their saved layout might contain irrelevant widgets.
  - *Mitigation*: Ensure the frontend merges the stored layout with a default widget checklist authorized for the user's current role.

### 4. Self-Service BI Widget Configurer
- **Layout Config Schema Extension**: Every grid item record will support optional settings:
  ```typescript
  interface GridItemConfig {
    i: string; // widget ID
    x: number;
    y: number;
    w: number;
    h: number;
    title?: string; // Custom title
    dataSource?: 'kpi-summary' | 'risk-heatmap' | 'coso-heatmap' | 'deficiencies-severity' | 'deficiency-status';
    vizType?: 'heatmap' | 'bar' | 'pie' | 'summary';
  }
  ```
- **Edit Mechanism**: A popover will render forms inside the widget header allowing title, dataSource, and vizType customization.
- **Visualizer Mapping**: A dynamic mapping component inside each widget will render the correct chart type (Recharts Bar, Pie, Heatmap grid, or KPI cards) depending on the user's configurations.
