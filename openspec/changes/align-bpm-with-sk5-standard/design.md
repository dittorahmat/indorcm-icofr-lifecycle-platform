# Design: BPM Standard Alignment (Docking Nodes)

## Data Architecture

### Database Schema Updates
We need to track which Risk (RCM) and Control belongs to which Node in which Diagram.

```typescript
// Proposed structure for bpm_diagrams nodes
interface ActivityNodeData {
  label: string;
  role: string;
  riskIds: string[]; // List of RCM IDs linked to this node
}

// Relational logic (conceptual)
// RCMs (Risks) are already in `rcms` table
// Controls are already in `controls` table linked via `rcmId`
```

### Global Warning System
A utility function to check usage before deletion:
```typescript
async function checkUsage(entityId: string, type: 'Risk' | 'Control') {
  // Query all diagrams/nodes to see if this ID is referenced elsewhere
  // Return count and location names
}
```

## UI/UX Components

### 1. Custom Node: `SmartActivityNode`
- A React component for React Flow.
- Renders a Square box for the Activity.
- Conditionally renders `DockedIcon` components at fixed relative positions:
    - `RiskIcon`: Positioned at Bottom-Left.
    - `ControlIcon`: Positioned at Bottom-Right.

### 2. Sidebar: `AuditProperties`
- **Tab: Risks**
    - List of linked risks.
    - Search & Select existing risks from Library.
    - Inline create new risk.
- **Tab: Controls (Grouped)**
    - Grouped by the risk they mitigate.
    - Add control to specific risk.

## API Requirements
- `POST /api/bpm/link-risk`: Link an RCM record to a specific Diagram Node.
- `POST /api/bpm/link-control`: Link a Control to a Risk within a Node.
- `DELETE /api/bpm/unlink`: Remove the connection.
- `GET /api/bpm/usage-check`: Get usage stats for the warning modal.

## Migration Plan
- Existing diagram data in `bpm_diagrams` will be reset (as approved by user).
- Seed data will be updated to use the new nested format.
