import { IndexedEntity } from "./core-utils";
import type { 
  User, Chat, ChatMessage, RCM, Control, CSARecord, TestRecord, 
  Deficiency, ActionPlan, Materiality, Scoping, Application, 
  RiskLibrary, AggregateDeficiency, GLSnapshot, MaterialitySimulation,
  BPMProcess
} from "@shared/types";
import { MOCK_USERS, MOCK_CHATS, MOCK_CHAT_MESSAGES, MOCK_RCM, MOCK_CONTROLS, MOCK_DEFICIENCIES, MOCK_ACTION_PLANS, MOCK_MATERIALITY, MOCK_SCOPING, MOCK_APPLICATIONS, MOCK_RISK_LIBRARY } from "@shared/mock-data";

// --- ICOFR Entities ---

interface Auditable {
  auditTrail: { action: string; userId: string; timestamp: number }[];
}

export class GLSnapshotEntity extends IndexedEntity<GLSnapshot & Auditable> {
  static readonly entityName = "glsnapshot";
  static readonly indexName = "glsnapshots";
  static readonly initialState: GLSnapshot & Auditable = { 
    id: "", filename: "", uploadDate: 0, rows: [], status: "Draft", isActive: false, benchmarkMapping: {}, auditTrail: [] 
  };
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class SimulationEntity extends IndexedEntity<MaterialitySimulation & Auditable> {
  static readonly entityName = "simulation";
  static readonly indexName = "simulations";
  static readonly initialState: MaterialitySimulation & Auditable = { 
    id: "", name: "", year: new Date().getFullYear(), status: "Draft", 
    basis: "PBT", omPercentage: 5, haircutPercentage: 25, locationCount: 1, omValue: 0, pmValue: 0, 
    glSnapshotId: "", assessmentData: {}, createdBy: "", createdAt: 0, history: [], auditTrail: [] 
  };
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class BPMProcessEntity extends IndexedEntity<BPMProcess & Auditable> {
  static readonly entityName = "bpmprocess";
  static readonly indexName = "bpmprocesses";
  static readonly initialState: BPMProcess & Auditable = { 
    id: "", name: "", noGL: "", fsliName: "", createdBy: "", createdAt: 0, auditTrail: [] 
  };
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class AggregateDeficiencyEntity extends IndexedEntity<AggregateDeficiency & Auditable> {
  static readonly entityName = "aggregatedeficiency";
  static readonly indexName = "aggregatedeficiencies";
  static readonly initialState: AggregateDeficiency & Auditable = { 
    id: "", name: "", year: new Date().getFullYear(), deficiencyIds: [], affectedAccounts: [], 
    affectedAssertions: [], combinedMagnitude: 0, aggregateLikelihood: "Low", 
    finalSeverity: "Control Deficiency", conclusionRationale: "", 
    identifiedBy: "", identifiedDate: 0, auditTrail: [] 
  };
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class RCMEntity extends IndexedEntity<RCM & Auditable> {
  static readonly entityName = "rcm";
  static readonly indexName = "rcms";
  static readonly initialState: RCM & Auditable = { id: "", process: "", subProcess: "", riskDescription: "", status: "Draft", controls: [], auditTrail: [] };
  static seedData = MOCK_RCM.map(r => ({ ...r, auditTrail: [] }));
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class ControlEntity extends IndexedEntity<Control & Auditable> {
  static readonly entityName = "control";
  static readonly indexName = "controls";
  static readonly initialState: Control & Auditable = { 
    id: "", rcmId: "", code: "", name: "", description: "", ownerId: "", 
    type: "Preventive", nature: "Manual", frequency: "Monthly",
    assertions: [], ipos: [], cosoPrinciples: [], isFraudRisk: false, effectiveDate: Date.now(),
    riskRating: "Low", isKeyControl: false, 
    auditTrail: [] 
  };
  static seedData = MOCK_CONTROLS.map(c => ({ ...c, cosoPrinciples: [10], isFraudRisk: false, effectiveDate: Date.now(), auditTrail: [] }));
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class CSAEntity extends IndexedEntity<CSARecord & Auditable> {
  static readonly entityName = "csa";
  static readonly indexName = "csas";
  static readonly initialState: CSARecord & Auditable = { id: "", controlId: "", period: "", assessmentDate: 0, assessedBy: "", result: "Low", comments: "", auditTrail: [] };
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class TestEntity extends IndexedEntity<TestRecord & Auditable> {
  static readonly entityName = "test";
  static readonly indexName = "tests";
  static readonly initialState: TestRecord & Auditable = { 
    id: "", controlId: "", testType: "TOD", method: "Inspection", period: "", 
    testDate: 0, testedBy: "", result: "Fail", comments: "", 
    evaluationAttributes: {
      objectiveAchieved: false,
      timingAccuracy: false,
      authorityCompetence: false,
      infoReliability: false,
      periodCoverage: false,
      evidenceAvailability: false,
    },
    auditTrail: [] 
  };
  static seedData: (TestRecord & Auditable)[] = [
    {
      id: "test-1", controlId: "ctrl-001", testType: "TOD", method: "Inspection", period: "2024-Q1",
      testDate: Date.now() - 172800000, testedBy: "Internal Audit A", result: "Pass", 
      comments: "Walkthrough confirms control design is aligned with policy.",
      evaluationAttributes: {
        objectiveAchieved: true, timingAccuracy: true, authorityCompetence: true,
        infoReliability: true, periodCoverage: true, evidenceAvailability: true,
      },
      auditTrail: []
    },
    {
      id: "test-2", controlId: "ctrl-001", testType: "TOE", method: "Reperformance", period: "2024-Q1",
      testDate: Date.now() - 86400000, testedBy: "Internal Audit A", result: "Pass", sampleSize: 25,
      comments: "Tested 25 samples from Q1 population. No deviations found.",
      evaluationAttributes: {
        objectiveAchieved: true, timingAccuracy: true, authorityCompetence: true,
        infoReliability: true, periodCoverage: true, evidenceAvailability: true,
      },
      auditTrail: []
    },
    {
      id: "test-3", controlId: "ctrl-002", testType: "TOD", method: "Inquiry", period: "2024-Q1",
      testDate: Date.now() - 259200000, testedBy: "Internal Audit B", result: "Fail",
      comments: "Missing evidence of secondary review in the current workflow design.",
      evaluationAttributes: {
        objectiveAchieved: false, timingAccuracy: true, authorityCompetence: true,
        infoReliability: true, periodCoverage: true, evidenceAvailability: false,
      },
      auditTrail: []
    }
  ];
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class DeficiencyEntity extends IndexedEntity<Deficiency & Auditable> {
  static readonly entityName = "deficiency";
  static readonly indexName = "deficiencies";
  static readonly initialState: Deficiency & Auditable = { id: "", controlId: "", description: "", severity: "Control Deficiency", identifiedDate: 0, identifiedBy: "", status: "Open", relatedAssertions: [], auditTrail: [] };
  static seedData = MOCK_DEFICIENCIES.map(d => ({ ...d, auditTrail: [] }));
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class ActionPlanEntity extends IndexedEntity<ActionPlan & Auditable> {
  static readonly entityName = "actionplan";
  static readonly indexName = "actionplans";
  static readonly initialState: ActionPlan & Auditable = { id: "", deficiencyId: "", description: "", ownerId: "", dueDate: 0, status: "Draft", auditTrail: [] };
  static seedData = MOCK_ACTION_PLANS.map(a => ({ ...a, auditTrail: [] }));
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class MaterialityEntity extends IndexedEntity<Materiality & Auditable> {
  static readonly entityName = "materiality";
  static readonly indexName = "materialities";
  static readonly initialState: Materiality & Auditable = { id: "", year: new Date().getFullYear(), overallMateriality: 0, performanceMateriality: 0, benchmark: "Pre-Tax Income", percentage: 5, haircut: 25, auditTrail: [] };
  static seedData = MOCK_MATERIALITY.map(m => ({ ...m, auditTrail: [] }));
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class ScopingEntity extends IndexedEntity<Scoping & Auditable> {
  static readonly entityName = "scoping";
  static readonly indexName = "scopings";
  static readonly initialState: Scoping & Auditable = { id: "", year: new Date().getFullYear(), significantAccounts: [], significantLocations: [], significantProcesses: [], auditTrail: [] };
  static seedData = MOCK_SCOPING.map(s => ({ ...s, auditTrail: [] }));
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class ChangeLogEntity extends IndexedEntity<ChangeLog> {
  static readonly entityName = "changelog";
  static readonly indexName = "changelogs";
  static readonly initialState: ChangeLog = { id: "", entityId: "", entityType: "Control", descriptionBefore: "", descriptionAfter: "", userId: "", timestamp: 0 };
  static seedData: ChangeLog[] = [
    { id: "log-1", entityId: "ctrl-001", entityType: "Control", descriptionBefore: "Frequency: Monthly", descriptionAfter: "Frequency: Ad-hoc", userId: "u2", timestamp: Date.now() - 86400000 },
  ];
}

export class SOCReportEntity extends IndexedEntity<SOCReport & Auditable> {
  static readonly entityName = "socreport";
  static readonly indexName = "socreports";
  static readonly initialState: SOCReport & Auditable = { id: "", vendorName: "", reportType: "SOC 1 Type 2", periodStart: 0, periodEnd: 0, issuer: "", status: "Pending Review", lastValidatedDate: 0, auditTrail: [] };
  static seedData: (SOCReport & Auditable)[] = [
    { id: "soc-1", vendorName: "Cloud Provider X", reportType: "SOC 1 Type 2", periodStart: Date.now() - 31536000000, periodEnd: Date.now() + 86400000, issuer: "Audit Firm Y", status: "Valid", lastValidatedDate: Date.now(), auditTrail: [] },
  ];
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class ApplicationEntity extends IndexedEntity<Application & Auditable> {
  static readonly entityName = "application";
  static readonly indexName = "applications";
  static readonly initialState: Application & Auditable = { id: "", name: "", description: "", statusITGC: "Not Tested", criticality: "Medium", auditTrail: [] };
  static seedData = MOCK_APPLICATIONS.map(a => ({ ...a, auditTrail: [] }));
  async getAuditTrail() { return (await this.getState()).auditTrail; }
}

export class RiskLibraryEntity extends IndexedEntity<RiskLibrary> {
  static readonly entityName = "risklibrary";
  static readonly indexName = "risklibraries";
  static readonly initialState: RiskLibrary = { id: "", cluster: "Umum", riskDescription: "", suggestedAssertions: [] };
  static seedData = MOCK_RISK_LIBRARY;
}

export class SettingsEntity extends IndexedEntity<Settings> {
  static readonly entityName = "settings";
  static readonly indexName = "settings";
  static readonly initialState: Settings = { 
    id: "global", 
    companyName: "PT BUMN Energi Utama", 
    ceoName: "Budi Santoso", 
    cfoName: "Siti Aminah", 
    fiscalYear: new Date().getFullYear(),
    isPeriodLocked: false 
  };
  static seedData = [{ 
    id: "global", 
    companyName: "PT BUMN Energi Utama", 
    ceoName: "Budi Santoso", 
    cfoName: "Siti Aminah", 
    fiscalYear: new Date().getFullYear(),
    isPeriodLocked: false 
  }];
}

// --- Original Demo Entities ---
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}