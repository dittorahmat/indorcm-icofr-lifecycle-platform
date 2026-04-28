## Context

The IndoGRC Pro platform manages ICOFR business processes using a visual BPM editor. These diagrams are stored in the `bpm_diagrams` table. Currently, when a user creates a new "Flow" from the BPM Worksheet or BPM Page, the backend creates a record but fails to store the `year` and `subProcess` fields. This results in diagrams that exist in the database with `year: NULL`, which are then filtered out by the frontend's year-based view (`/api/bpm-diagrams?year=2025`).

Furthermore, the frontend editor fails to provide a default "Start" node for these new diagrams because it incorrectly evaluates the empty node array returned by the server.

## Goals / Non-Goals

**Goals:**
- Fix the data gap in `worker/user-routes.ts` for both creation and update of BPM diagrams.
- Ensure new diagrams are initialized with a standard "Mulai" (Start) node in the editor.
- Verify that saving a diagram persists all metadata (`name`, `year`, `subProcess`, `nodes`, `edges`).

**Non-Goals:**
- Implementing a bulk migration script for old `NULL` year diagrams (users can re-save them if needed).
- Changing the underlying data structure of the nodes/edges JSON.

## Decisions

### 1. Update Backend Route Handlers
We will modify the `POST` and `PUT` handlers for `/api/bpm-diagrams` in `worker/user-routes.ts`.
- **POST**: Extract `year` and `subProcess` from `req.json()` and include them in the `db.insert` values.
- **PUT**: Update the `.set()` object to include `year` and `subProcess`.

### 2. Fix Frontend Node Hydration
In `src/components/rcm/BPMEditor.tsx`, we will replace the logical OR (`||`) for `nodes` with a length check.
- **Change**: `setNodes(diagram.nodes || initialNodes)` -> `setNodes(diagram.nodes?.length > 0 ? diagram.nodes : initialNodes)`.
- **Rationale**: `[]` is a truthy value in JavaScript. Since the backend returns `nodes: []` for new diagrams, the previous logic was skipping the `initialNodes` fallback.

### 3. Synchronize Year in Save Mutation
The `saveMutation` in `BPMEditor.tsx` currently lacks the `year` field.
- **Action**: Pass the `year` as part of the data object in `saveMutation.mutate`.
- **Note**: We should ensure `year` is extracted from the `diagram` data loaded by the component.

### 4. Localization Strategy
We will introduce new keys in `bpm.json` for editor-specific labels:
- `editor.nodes.start`: "Mulai" / "Start"
- `editor.nodes.activity`: "New Activity" / "Aktivitas Baru"
- `editor.nodes.automated`: "System Process" / "Proses Sistem"
- `editor.nodes.decision`: "Decision?" / "Keputusan?"
- `editor.nodes.output`: "System Output" / "Output Sistem"
- `editor.nodes.physical`: "Physical Form" / "Form Fisik"
- `editor.roles.default`: "Staff" / "Staf"

### 5. Database Schema Synchronization
- **Command**: `npx drizzle-kit generate` to detect missing columns in `bpm_diagrams`.
- **Verification**: Ensure `year` and `sub_process` are correctly defined in the migration file before applying.

## Risks / Trade-offs

- **[Risk]** Updating the `year` in a `PUT` request might move a diagram to a different fiscal year if the user changes the view while editing.
  - **Mitigation**: The `year` should be derived from the loaded `diagram` object itself, not the global state, to ensure it remains pinned to its original creation year unless explicitly changed.
- **[Risk]** Migration might fail if there are existing `NULL` values in a column we decide to make `NOT NULL`.
  - **Mitigation**: Columns will remain nullable in the short term, or a default value (e.g., current year) will be provided.

