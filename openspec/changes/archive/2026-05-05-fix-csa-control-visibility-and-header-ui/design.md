## Context

Controls defined in the Visual BPM Editor are frequently reported as missing (0 controls) in the tabular Assessment and Worksheet views. This happens because the linkage between a control and its parent `BPMProcess` is fragile, relying on exact string matches of the Sub-Process name. If a user enters "Penerimaan setoran tunai" in one place and "Penerimaan Setoran Tunai" in another, the connection breaks. Furthermore, controls created in the editor often lack the explicit `bpmProcessId` required for reliable retrieval.

## Goals / Non-Goals

**Goals:**
- Ensure controls are consistently visible across all views regardless of text casing.
- Establish a hard link (ID-based) between visual nodes and process records on save.
- Modernize the Execution Hub header to prioritize the process being assessed.

**Non-Goals:**
- Automating a full database-wide migration of all historical data (focus is on reliable behavior moving forward).
- Redesigning the entire Control or RCM data models.

## Decisions

### 1. Robust Case-Insensitive Matching
The system will adopt a "lowercase comparison" standard for Sub-Process names in both backend and frontend.
- **Frontend**: `.filter(c => c.subProcess?.toLowerCase().trim() === targetName.toLowerCase().trim())`.
- **Backend**: Use `ilike` or `LOWER(sub_process) = LOWER(?)` when resolving process IDs.

### 2. Additive Filtering Strategy (Inclusive Matching)
To maximize data visibility and self-healing, the control filtering logic will move from an exclusive "AND" approach to an additive "OR" approach. A control will be displayed if ANY of the following match:
1.  The `bpmProcessId` matches exactly.
2.  The `subProcess` name matches (case-insensitive and trimmed).
3.  The control is "orphaned" (no process ID or name) but belongs to the correct GL Account (`fsliCodes`).

### 3. Automatic Link Resolution on Save
The `PUT /api/bpm-diagrams/:id` route will be enhanced. Upon saving a diagram:
- The system will look up the `bpmProcesses` table for a record matching the diagram's `subProcess` name and `organizationId`.
- If found, it will inject this `bpmProcessId` and the process's linked `noGL` into the metadata of all controls being upserted.
- This ensures that even if names are slightly modified later, the ID-based link remains intact.

### 3. Execution Hub Header Hierarchy
The `BPMModal` header will be restructured:
- **Primary Title**: Large font, bold Sub-Process name.
- **Sub-header**: Badge for GL Account Number, text for FSLI name.
- **Visuals**: Use icons to differentiate between Process context and Account context.

## Risks / Trade-offs

- [Risk] Existing orphaned data won't be fixed until the next "Save" in the BPM Editor. → [Mitigation] This is acceptable as a "self-healing" mechanism that avoids complex one-off migration scripts.
- [Risk] Performance hit on large diagrams during link resolution. → [Mitigation] The lookup is indexed by `organizationId` and name, keeping it extremely fast.
