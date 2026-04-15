# Design: Relational Audit Mapping

## Database Schema Changes (`worker/db/schema.ts`)

We will introduce two new tables to handle the many-to-many relationships defined in the audit hierarchy.

### 1. `bpm_node_rcms`
Links a visual Activity node to a Master Risk (RCM).
```typescript
export const bpmNodeRcms = pgTable("bpm_node_rcms", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id),
  diagramId: text("diagram_id").notNull().references(() => bpmDiagrams.id, { onDelete: 'cascade' }),
  nodeId: text("node_id").notNull(), // The React Flow node ID (e.g., 'node_123')
  rcmId: text("rcm_id").notNull().references(() => rcms.id, { onDelete: 'cascade' })
});
```

### 2. `rcm_controls`
Links a Master Risk (RCM) to a Master Control.
```typescript
export const rcmControls = pgTable("rcm_controls", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id),
  rcmId: text("rcm_id").notNull().references(() => rcms.id, { onDelete: 'cascade' }),
  controlId: text("control_id").notNull().references(() => controls.id, { onDelete: 'cascade' })
});
```

## Backend API Adjustments

### `PUT /api/bpm-diagrams/:id` (Global Save)
When the user clicks "Save Alur" in the BPM Editor, the backend will:
1. Update the `nodes` and `edges` JSON in `bpm_diagrams` (for layout purposes).
2. Delete all existing `bpm_node_rcms` for this `diagramId`.
3. Iterate through the submitted `nodes` array. For every `Activity` node that contains `riskIds`, insert new rows into `bpm_node_rcms`.
4. (Optional but recommended) Sync `rcm_controls` based on the visual mapping, ensuring the control-to-risk links are up to date.

### `GET /api/bpm-diagrams/by-control/:controlId`
A new endpoint for the CSA module. It returns the diagram details and the specific `nodeId` that the control is linked to, allowing the frontend to render the React Flow Mini-Viewer and highlight the target activity.

## Frontend Updates (`src/components/rcm/BPMEditor.tsx`)
- The frontend logic remains largely the same because we already structure the data hierarchically in memory (`node.data.risks`). 
- The save function simply passes this nested structure to the backend.
- When loading a diagram, the frontend will rely on the `nodes` JSON for layout, but the backend could optionally hydrate/validate the `riskIds` and `controlIds` based on the relational tables to ensure 100% accuracy.
