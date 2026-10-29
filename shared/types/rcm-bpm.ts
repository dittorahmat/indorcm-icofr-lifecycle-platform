import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
import type { ControlAssertion, InformationProcessingObjective } from './common';
import type { QualitativeLevel } from './org';
import type { BPMWorkflowStatus, WorkflowHistoryEntry, COSOPrinciple } from './scoping';
export type ControlLevel = "ELC" | "TLC" | "ITGC";

export interface Control extends Omit<InferSelectModel<typeof schema.controls>, 'relatedControlIds' | 'ipos' | 'assertions' | 'fsliCodes' | 'attributeQuestions' | 'effectiveDate' | 'lastCsaDate' | 'isMigrated' | 'aiGuessedFields'> {
  assertions: ControlAssertion[];
  ipos: InformationProcessingObjective[];
  cosoPrinciples: COSOPrinciple[];
  relatedControlIds: string[];
  fsliCodes?: string[];
  attributeQuestions?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  mrcMetadata?: {
    expectation: string;
    investigationThreshold: string;
    investigationProcedures: string;
  };
  line2Validation?: {
    status: "Pending" | "Validated" | "Rejected";
    validatedBy?: string;
    validatedDate?: number;
    testOfOneEvidenceUrl?: string;
    comments?: string;
  };
  effectiveDate: number | null;
  lastCsaDate: number | null;
  isMigrated?: boolean | null;
  aiGuessedFields?: string[] | null;
}

export type BPMProcessLevel = 'process' | 'sub_process';

export type BPMProcess = Omit<InferSelectModel<typeof schema.bpmProcesses>, 'createdAt' | 'workflowHistory' | 'level'> & {
  createdAt: number;
  workflowStatus: BPMWorkflowStatus;
  workflowHistory: WorkflowHistoryEntry[];
  level?: BPMProcessLevel | null;
  parentId?: string | null;
};

export interface BPMProcessWithChildren extends BPMProcess {
  children?: BPMProcessWithChildren[];
}

export interface BPMNode {
  id: string;
  type: "start" | "end" | "activity" | "automated-activity" | "decision" | "document" | "system" | "risk" | "control" | "archive" | "swimlane" | "docked-risk" | "docked-control" | "reference" | "manual-input" | "external-process" | "off-page-ref" | "data-media" | "alternate-process" | "data" | "predefined-process" | "internal-storage" | "multi-document" | "preparation" | "manual-operation" | "card" | "punched-tape" | "summing-junction" | "or" | "collate" | "sort" | "extract" | "merge" | "stored-data" | "delay" | "sequential-access" | "direct-access" | "display" | "loop-limit" | "annotation";
  position: { x: number; y: number };
  parentId?: string; // For React Flow grouping/docking
  extent?: 'parent'; // For React Flow docking
  width?: number; // For resizable nodes like swimlanes
  height?: number;
  data: {
    label: string;
    description?: string;
    role?: string;
    code?: string;
    stepRef?: string;
    department?: string; // For Swimlane labels
    function?: string;   // For Swimlane labels
    riskIds?: string[]; // Multiple RCM IDs linked to this node
    controlIds?: string[]; // Multiple Control IDs linked to this node
    regulatoryData?: any; // Legacy/Single pair support
    regulatoryPairs?: any[]; // For universal mapping (multiple Risk-Control pairs)
    hasLinkage?: boolean;
    relatedElcNames?: string[];
    targetSheetId?: string;
    targetSheetName?: string;
    sourceSheetId?: string;
    sourceSheetName?: string;
    direction?: 'in' | 'out';
  };
}

export type BPMEdgeRoutingMode = 'auto' | '1-corner' | '2-corner';

export interface BPMEdgeData {
  bendOffset?: {
    x?: number;
    y?: number;
  };
  routingMode?: BPMEdgeRoutingMode;
  [key: string]: any;
}

export interface BPMEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  type?: string;
  style?: Record<string, any>;
  data?: BPMEdgeData;
}

export type RCMControlMapping = InferSelectModel<typeof schema.rcmControls>;

export interface BPMDiagramSheet {
  id: string;
  name: string;
  order: number;
  nodes: BPMNode[];
  edges: BPMEdge[];
}

export interface BPMDiagramMetadata {
  sheets?: BPMDiagramSheet[];
  activeSheetId?: string;
  [key: string]: any;
}

export interface RCM extends Omit<InferSelectModel<typeof schema.rcms>, 'auditTrail' | 'workflowStatus' | 'workflowHistory'> {
  riskRating: QualitativeLevel;
  status: "Draft" | "Pending Validation" | "Active" | "Archived" | "Pending Change Approval";
  controls: string[]; // Array of Control IDs
  workflowStatus?: string | null;
  workflowHistory?: WorkflowHistoryEntry[] | null;
  bpmData?: {
    nodes: BPMNode[];
    edges: BPMEdge[];
  };
  changeRequest?: {
    requestedBy: string;
    requestedAt: number;
    description: string;
    proposedData: Partial<RCM>;
  };
}

/** Lini 1 (preparer) verification-design fields. The allow-list partition is
 *  owned by the rcm-matrix-write domain module (arch-09 T4); unknown keys in
 *  a request body never reach the store. */
export interface VerificationLini1Fields {
  controlName?: string | null;
  controlDescription?: string | null;
  supportingDocs?: string | null;
  isKeyControl?: boolean | null;
  ipoC?: string | null;
  ipoA?: string | null;
  ipoV?: string | null;
  ipoRa?: string | null;
  assertionE?: string | null;
  assertionC?: string | null;
  assertionA?: string | null;
  assertionCo?: string | null;
  assertionVa?: string | null;
  assertionRo?: string | null;
  assertionPd?: string | null;
  controlType?: string | null;
  controlNature?: string | null;
  automatedControlType?: string | null;
  frequency?: string | null;
  supportingApp?: string | null;
  applicationId?: string | null;
  executingFunction?: string | null;
  executorRole?: string | null;
  affectedFsliItem?: string | null;
  effectivePeriod?: string | null;
}

/** Lini 2 (TOD review) verification-design fields. */
export interface VerificationLini2Fields {
  pilarObjective?: string | null;
  pilarTiming?: string | null;
  pilarAuthority?: string | null;
  pilarReliability?: string | null;
  pilarCoverage?: string | null;
  pilarEvidence?: string | null;
  kkReference?: string | null;
  conclusion?: string | null;
  comment?: string | null;
}

/** PATCH /rcm-matrix/verification-design/:mappingId body (typed, no `any`). */
export interface VerificationDesignPatchBody extends VerificationLini1Fields, VerificationLini2Fields {
  [field: string]: string | boolean | null | undefined;
}

/** POST /rcm-matrix/:type/batch-update item. `automatedSubNature` is a FE
 *  alias converging onto the `automatedControlType` column. */
export interface VerificationBatchUpdateItem {
  mappingId?: string;
  riskDescription?: string;
  riskRating?: string;
  isFraudRelated?: boolean;
  [field: string]: string | boolean | null | undefined;
}

/** POST /rcm-matrix/verification-design body (create path). */
export interface CreateVerificationDesignBody extends VerificationDesignPatchBody {
  createNewRcm?: boolean;
  rcmId?: string;
  process?: string;
  subProcess?: string;
  riskDescription?: string;
  riskRating?: string;
  isFraudRelated?: boolean;
  controlCode?: string;
  bpmProcessId?: string | null;
}


