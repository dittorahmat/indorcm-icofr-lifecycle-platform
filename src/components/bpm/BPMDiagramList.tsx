import * as React from 'react';
import { DiagramListCards } from './diagram-list/DiagramListCards';
import { DiagramListTable } from './diagram-list/DiagramListTable';
import { DiagramListToolbar } from './diagram-list/DiagramListToolbar';
import { countAllProcesses, resolveDiagramTarget } from './diagram-list/diagram-list-utils';
import type { BPMDiagramListProps, RowCallbacks } from './diagram-list/diagram-list-types';
import type { BPMProcess, BPMProcessWithChildren } from '@shared/types';

export type { BPMDiagramListProps };

export function BPMDiagramList(props: BPMDiagramListProps) {
  const {
    hierarchicalProcesses,
    diagrams,
    selectedProcessIds,
    onOpenDiagram,
    onCreateDiagram,
    onSelectProcess,
    onOpenWorksheet,
    onDeleteProcess,
    onToggleSelect,
    onToggleExpand,
    onExpandAll,
    onCollapseAll,
    onOpenMigrationModal,
  } = props;

  // Flattened count of all processes (root + children)
  const totalProcessesCount = React.useMemo(() => countAllProcesses(hierarchicalProcesses), [hierarchicalProcesses]);

  const allSelected = totalProcessesCount > 0 && selectedProcessIds.length === totalProcessesCount;

  // Shared open-or-create logic for macro and micro diagrams.
  const openDiagramFor = React.useCallback(
    (proc: BPMProcess | BPMProcessWithChildren) => {
      const target = resolveDiagramTarget(diagrams, proc);
      if (target.mode === 'open') onOpenDiagram(target.diagramId, proc.name, proc.id);
      else onCreateDiagram(proc.name);
    },
    [diagrams, onOpenDiagram, onCreateDiagram],
  );

  const callbacks: RowCallbacks = {
    onSelectProcess,
    onOpenDiagram,
    onCreateDiagram,
    onOpenWorksheet,
    onDeleteProcess,
    onToggleSelect,
    onToggleExpand,
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden flex flex-col">
      <DiagramListToolbar
        selectedCount={selectedProcessIds.length}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        onOpenMigrationModal={onOpenMigrationModal}
      />
      <DiagramListTable props={props} callbacks={callbacks} allSelected={allSelected} onOpenDiagramFor={openDiagramFor} />
      <DiagramListCards props={props} callbacks={callbacks} onOpenDiagramFor={openDiagramFor} />
    </div>
  );
}
