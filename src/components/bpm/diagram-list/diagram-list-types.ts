import type { BPMDiagram, BPMProcess, BPMProcessWithChildren, GLRow, Settings } from '@shared/types';

export interface BPMDiagramListProps {
  bpmLoading: boolean;
  hierarchicalProcesses: BPMProcessWithChildren[];
  diagrams?: { items: BPMDiagram[] };
  settings?: Settings;
  selectedGLRow?: GLRow | null;
  selectedProcessId?: string | null;
  onSelectProcess?: (bpm: BPMProcess) => void;
  onOpenDiagram: (diagramId: string, subProcess: string, bpmProcessId?: string) => void;
  onCreateDiagram: (subProcess: string) => void;
  onOpenWorksheet: (bpmId: string, bpmName: string) => void;
  onDeleteProcess: (bpmId: string, bpmName: string) => void;
  searchTerm: string;

  // Hierarchical & Batch Actions
  selectedProcessIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  expandedProcessIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenMigrationModal: () => void;
}

export interface RowCallbacks {
  onSelectProcess?: (bpm: BPMProcess) => void;
  onOpenDiagram: (diagramId: string, subProcess: string, bpmProcessId?: string) => void;
  onCreateDiagram: (subProcess: string) => void;
  onOpenWorksheet: (bpmId: string, bpmName: string) => void;
  onDeleteProcess: (bpmId: string, bpmName: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}
