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
    department?: string; // For Swimlane labels
    function?: string;   // For Swimlane labels
    riskIds?: string[]; // Multiple RCM IDs linked to this node
    controlIds?: string[]; // Multiple Control IDs linked to this node
    regulatoryData?: any; // Legacy/Single pair support
    regulatoryPairs?: any[]; // For universal mapping (multiple Risk-Control pairs)
    hasLinkage?: boolean;
    relatedElcNames?: string[];
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


