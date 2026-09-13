## Context

In IndoGRC Pro, business processes are represented by `bpm_processes` and mapped to general ledger accounts (`bpm_process_gl_codes`). The visual flowcharts for these processes are stored separately in `bpm_diagrams`, and individual flowchart nodes are linked to risks in `bpm_node_rcms`. Additionally, risks in `rcms` maintain a foreign key reference `rcms.diagram_id` pointing to `bpm_diagrams.id`.

When deleting a process via `BpmService.deleteProcess`:
1. It only deleted `bpm_processes` while leaving `bpm_diagrams` in place.
2. `bpm_diagrams` deletion failed if attempted manually due to `rcms.diagram_id` foreign key constraints (`ON DELETE NO ACTION`).
3. Recreating a process with the same name picked up the orphaned diagram, causing surprise to users.

## Goals / Non-Goals

**Goals:**
- Implement safe cascade deletion in `BpmService.deleteProcess` for diagrams associated with the deleted process when not shared with other processes.
- Ensure all foreign key references (`rcms.diagram_id`, `bpm_node_rcms.diagram_id`) are cleanly decoupled or deleted before deleting diagrams.
- Harden `BpmService.deleteDiagram` so standalone diagram deletion also safely decouples `rcms.diagram_id`.
- Preserve existing unit test pass rates and system stability.

**Non-Goals:**
- Deleting diagrams if another active BPM process in the same year and organization is still referencing the same sub-process name.
- Altering the fundamental schema relationship (e.g. adding cascade constraints on DB level) to minimize migration risks in production.

## Decisions

### 1. Process Sharing Detection
- **Decision**: Before deleting diagrams, verify if any other `bpm_processes` record exists with the same `name`, `organizationId`, and `year`.
- **Rationale**: A sub-process might be linked across different GL accounts or subsidiaries. We only delete the diagram when the last process referencing it is deleted.

### 2. Ordered Decoupling Sequence
- **Decision**: Execute deletions in the following sequence:
  1. Identify candidate diagrams for the sub-process (`sub_process = process.name`, `year = process.year`).
  2. For those diagrams:
     - `UPDATE rcms SET diagram_id = NULL WHERE diagram_id IN (candidateDiagramIds)`
     - `DELETE FROM bpm_node_rcms WHERE diagram_id IN (candidateDiagramIds)`
     - `DELETE FROM bpm_diagrams WHERE id IN (candidateDiagramIds)`
  3. Decouple `controls.bpmProcessId = NULL`
  4. Decouple `csa_records.bpmProcessId = NULL`
  5. `DELETE FROM bpm_process_gl_codes WHERE bpm_process_id = process.id`
  6. `DELETE FROM bpm_processes WHERE id = process.id`
- **Rationale**: Respects PostgreSQL foreign key constraints and prevents orphaned linkages.

## Risks / Trade-offs

- **Risk**: Deleting a process inadvertently deletes a diagram that was accidentally named identically.
  - *Mitigation*: The sharing check prevents deletion if any other process shares the name.
