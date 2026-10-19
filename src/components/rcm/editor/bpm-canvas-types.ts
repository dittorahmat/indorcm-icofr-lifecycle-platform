import type { NodeTypes } from 'reactflow';
import type { BpmNodeType } from '@shared/bpm-node-types';
import {
  ActivityNode,
  AlternateProcessNode,
  AnnotationNode,
  ArchiveNode,
  AutomatedActivityNode,
  CardNode,
  CollateNode,
  DataMediaNode,
  DataNode,
  DecisionNode,
  DelayNode,
  DirectAccessNode,
  DisplayNode,
  DocumentNode,
  ExternalProcessNode,
  ExtractNode,
  InternalStorageNode,
  LoopLimitNode,
  ManualInputNode,
  ManualOperationNode,
  MergeNode,
  MultiDocumentNode,
  OffPageRefNode,
  OrNode,
  PreparationNode,
  PredefinedProcessNode,
  PunchedTapeNode,
  ReferenceNode,
  RiskControlBadge,
  SequentialAccessNode,
  SortNode,
  StartEndNode,
  StoredDataNode,
  SummingJunctionNode,
  SwimlaneNode,
} from '../nodes';
import { BridgeEdge } from '../edges/BridgeEdge';

/**
 * Renderer for every member of `BPMNodeType`.
 *
 * `satisfies Record<BpmNodeType, unknown>` locks both directions: a type added
 * to the union without a renderer fails to compile, and a key outside the union
 * fails too. Before this, `risk` and `control` were persistable with no
 * renderer at all — React Flow silently drew its default node for them.
 */
const BPM_NODE_RENDERERS = {
  start: StartEndNode,
  end: StartEndNode,
  activity: ActivityNode,
  'automated-activity': AutomatedActivityNode,
  decision: DecisionNode,
  document: DocumentNode,
  archive: ArchiveNode,
  'data-media': DataMediaNode,
  reference: ReferenceNode,
  'off-page-ref': OffPageRefNode,
  'manual-input': ManualInputNode,
  'external-process': ExternalProcessNode,
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
  // Linkage badges and the swimlane container.
  system: AutomatedActivityNode,
  risk: RiskControlBadge,
  control: RiskControlBadge,
  'docked-risk': RiskControlBadge,
  'docked-control': RiskControlBadge,
  swimlane: SwimlaneNode,
} satisfies Record<BpmNodeType, unknown>;

/**
 * Keys that are not `BpmNodeType` members but appear on diagrams drawn by older
 * builds. Renderers only — they are not node types.
 */
const LEGACY_NODE_RENDERERS = {
  'risk-control-badge': RiskControlBadge,
} as const;

/** Every `BpmNodeType` has a renderer; the parity is asserted at compile time. */
export const bpmNodeTypes: NodeTypes = { ...BPM_NODE_RENDERERS, ...LEGACY_NODE_RENDERERS };

export const bpmEdgeTypes = {
  bridge: BridgeEdge,
};
