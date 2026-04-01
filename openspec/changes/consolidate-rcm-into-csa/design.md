## Context
The user wants to merge the Risk Control Matrix (RCM) functionality into the Control Self-Assessment (CSA) Workspace. This aligns with a workflow where users first understand the risks and controls before performing the assessment.

## Goals / Non-Goals
**Goals:**
- Move the full RCM Matrix UI (Table/Cards with search) into a "Risk Control" tab in CSA.
- Maintain all functionality (BPM Flow viewer, Add Process, Add Control).
- Remove RCM from the global navigation to declutter the UI.

**Non-Goals:**
- Refactoring the entire API structure.
- Changing the underlying data entities.

## Decisions
- **Implementation Approach**: I will copy the core UI components and logic from `RCMList.tsx` into `CSAWorkspace.tsx`.
- **Shared Components**: If possible, I will extract shared logic (like the RCM Cards or BPM Dialog) into separate component files if they become too bulky in `CSAWorkspace.tsx`.
- **Navigation**: 
  - `MainHeader.tsx`: Remove the `/rcm` nav item.
  - `app-sidebar.tsx`: Remove `/rcm` and `/change-log` (assuming change logs are part of the RCM management being consolidated).

## Risks / Trade-offs
- [Size] → `CSAWorkspace.tsx` will become a very large file. *Mitigation*: Use sub-components for the different tabs.
- [Redundancy] → Keeping `RCMList.tsx` might cause confusion if it's not deleted. *Decision*: Keep it for now but remove all links to it.
