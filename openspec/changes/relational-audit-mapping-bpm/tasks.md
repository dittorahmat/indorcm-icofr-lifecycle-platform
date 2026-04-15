# Tasks: Relational Audit Mapping

## 1. Database Schema
- [x] 1.1 Add `bpm_node_rcms` table to `worker/db/schema.ts`.
- [x] 1.2 Add `rcm_controls` table to `worker/db/schema.ts`.
- [x] 1.3 Generate and apply Drizzle migrations.

## 2. Backend API
- [x] 2.1 Update `PUT /api/bpm-diagrams/:id` to extract relationships from the JSON payload and insert them into `bpm_node_rcms` and `rcm_controls`.
- [x] 2.2 Create `GET /api/bpm-diagrams/by-control/:controlId` endpoint for CSA viewer integration.
- [x] 2.3 Update `GET /api/bpm-diagrams/:id` to hydrate the JSON `nodes` with fresh data from the relational tables (ensuring visual truth).

## 3. Frontend Integration
- [x] 3.1 Update `BPMEditor.tsx` to handle the hydrated data properly on load.
- [x] 3.2 Create a `CSAViewerModal` (Mini-Viewer) component that takes a `diagramId` and a `highlightNodeId` to display the workflow context during assessment.

## 4. Cleanup & Migration
- [x] 4.1 Write a one-time script to migrate any existing embedded relationships in `bpm_diagrams.nodes` into the new relational tables.
- [x] 4.2 Deprecate the old `rcmId` column in the `controls` table if it's completely replaced by the `rcm_controls` many-to-many junction.
