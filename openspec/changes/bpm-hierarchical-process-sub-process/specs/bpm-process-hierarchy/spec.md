## Purpose

Provides a multi-tier hierarchical taxonomy for ICOFR business processes (FSLI -> GL -> Process -> Sub-Process), expandable tree visualization in the BPM workbench, and bidirectional batch migration to convert entities between parent processes and child sub-processes.

## ADDED Requirements

### Requirement: Hierarchical Process Data Model
The system SHALL support a self-referencing hierarchy where a business process can act as a parent (Macro Process) and contain multiple children (Micro Sub-Processes).
- Each process record SHALL persist an optional `parentId` referring to another process record.
- When `parentId` is null, the entity SHALL be treated as a root-level "Process" (Macro Process).
- When `parentId` is present, the entity SHALL be treated as a "Sub-Process" (Micro Process) under that parent.

#### Scenario: Sub-Process assigned to parent process
- **WHEN** a sub-process is queried or created with a valid `parentId`
- **THEN** the system links the record under the specified parent process and returns its hierarchy association.

### Requirement: Expandable Hierarchy View in BPM Workbench
The BPM workbench table SHALL display business processes and their corresponding sub-processes in an expandable tree table layout.
- The parent process row SHALL display an expand/collapse toggle (chevron icon).
- When expanded, all associated sub-processes SHALL be rendered nested under the parent row with visual indentation.
- The parent process row SHALL display aggregated risk and control counts computed from all its child sub-processes.
- The parent process row SHALL provide an action to view/edit the Macro Diagram.
- Each child sub-process row SHALL provide actions to view/edit the Micro Diagram and open the RCM Worksheet.

#### Scenario: Expanding a macro process
- **WHEN** user clicks the expand chevron on a parent process row
- **THEN** the table reveals all nested sub-processes with their respective micro diagram badges, risk counts, and control counts.

#### Scenario: Collapsing a macro process
- **WHEN** user clicks the collapse chevron on an expanded parent process row
- **THEN** the child sub-process rows are hidden and the chevron toggles to the collapsed state.

### Requirement: Bidirectional Batch Reorganization
The system SHALL provide a bidirectional batch migration action allowing users to promote sub-processes to independent processes or demote processes to sub-processes.
- The table SHALL allow multi-row selection via checkboxes.
- When one or more rows are selected, a batch action toolbar SHALL offer a "Reorganize / Migrate" modal.
- In "Demote to Sub-Process" mode, the user SHALL select a target parent process from the current GL scope, and upon confirmation, the selected processes SHALL have their `parentId` updated to the target parent.
- In "Promote to Independent Process" mode, upon confirmation, the selected sub-processes SHALL have their `parentId` set to null, promoting them to root-level processes.
- The migration operation MUST preserve all existing diagrams, nodes, and RCM control linkages without data loss.

#### Scenario: Demoting 4 processes into sub-processes of a parent
- **WHEN** user selects 4 standalone processes, opens the migration dialog, selects Process 1 as the target parent, and clicks apply
- **THEN** the system updates the 4 records to have `parentId` = Process 1 and refreshes the tree table to show them nested under Process 1.

#### Scenario: Promoting a sub-process to a standalone process
- **WHEN** user selects a sub-process nested under a parent, opens the migration dialog, selects "Promote to Independent Process", and clicks apply
- **THEN** the system sets `parentId` = null for that entity and refreshes the table to show it at root level.
