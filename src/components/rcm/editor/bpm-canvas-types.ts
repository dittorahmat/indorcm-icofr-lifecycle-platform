import { 
  StartEndNode, ActivityNode, ManualInputNode, ExternalProcessNode, 
  AutomatedActivityNode, DecisionNode, DocumentNode, ArchiveNode, 
  DataMediaNode, OffPageRefNode, ReferenceNode, RiskControlBadge, SwimlaneNode,
  AlternateProcessNode, DataNode, PredefinedProcessNode, InternalStorageNode,
  MultiDocumentNode, PreparationNode, ManualOperationNode, CardNode,
  PunchedTapeNode, SummingJunctionNode, OrNode, CollateNode, SortNode,
  ExtractNode, MergeNode, StoredDataNode, DelayNode, SequentialAccessNode,
  DirectAccessNode, DisplayNode, LoopLimitNode, AnnotationNode
} from '../nodes';
import { BridgeEdge } from '../edges/BridgeEdge';

export const bpmNodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  activity: ActivityNode,
  'manual-input': ManualInputNode,
  'external-process': ExternalProcessNode,
  'automated-activity': AutomatedActivityNode,
  decision: DecisionNode,
  document: DocumentNode,
  archive: ArchiveNode,
  'data-media': DataMediaNode,
  'off-page-ref': OffPageRefNode,
  reference: ReferenceNode,
  'risk-control-badge': RiskControlBadge,
  swimlane: SwimlaneNode,
  'alternate-process': AlternateProcessNode,
  data: DataNode,
  'predefined-process': PredefinedProcessNode,
  'internal-storage': InternalStorageNode,
  'multi-document': MultiDocumentNode,
  preparation: PreparationNode,
  'manual-operation': ManualOperationNode,
  card: CardNode,
  'punched-tape': PunchedTapeNode,
  'summing-junction': SummingJunctionNode,
  or: OrNode,
  collate: CollateNode,
  sort: SortNode,
  extract: ExtractNode,
  merge: MergeNode,
  'stored-data': StoredDataNode,
  delay: DelayNode,
  'sequential-access': SequentialAccessNode,
  'direct-access': DirectAccessNode,
  display: DisplayNode,
  'loop-limit': LoopLimitNode,
  annotation: AnnotationNode,
  // Legacy / Helper types
  system: AutomatedActivityNode,
  'docked-risk': RiskControlBadge,
  'docked-control': RiskControlBadge,
};

export const bpmEdgeTypes = {
  bridge: BridgeEdge,
};
