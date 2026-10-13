import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
export type CSASchedule = Omit<InferSelectModel<typeof schema.csaSchedules>, 'plannedDate' | 'createdAt'> & {
  plannedDate: number;
  createdAt: number;
};

export type CSASample = CSATestSample;

export interface CSAEvidenceMeta {
  lat?: number;
  lng?: number;
  accuracyM?: number;
  capturedAt?: number;
  gpsStatus?: 'granted' | 'denied' | 'timeout' | 'unavailable';
}

export interface CSATestSample extends Omit<InferSelectModel<typeof schema.csaSamples>, 'controlResults'> {
  controlResults?: Record<string, {
    implemented: boolean;
    evidenceUrl?: string;
    evidenceMeta?: CSAEvidenceMeta;
    comment?: string;
    riskId: string;
    riskName: string;
    controlName: string;
  }>;
}

export interface CSARecord extends Omit<InferSelectModel<typeof schema.csaRecords>, 'assessmentDate' | 'capturedAt' | 'line2ValidatedDate'> {
  result: "Effective" | "Ineffective" | "No Transaction";
  samples: CSATestSample[];
  assessmentDate: number;
  capturedAt: number | null;
  line2ValidatedDate: number | null;
};

/** Satu baris worklist "Belum Dinilai" CSA hub: control tanpa record non-draft. */
export interface CSAWorklistItem {
  controlId: string;
  code: string;
  name: string;
  level: string | null;
  bpmProcessId: string | null;
  bpmProcessName: string | null;
  noGL: string | null;
  riskDescription: string | null;
}

/** Respons endpoint worklist: item belum-dinilai + total control tahun itu. */
export interface CSAWorklistResponse {
  items: CSAWorklistItem[];
  totalControls: number;
}

export type TestSample = InferSelectModel<typeof schema.testSamples>;
export type NewTestSample = InferInsertModel<typeof schema.testSamples>;

export type TODEvaluation = Omit<InferSelectModel<typeof schema.todEvaluations>, 'createdAt' | 'updatedAt'> & {
  createdAt: number;
  updatedAt: number | null;
};
export type NewTODEvaluation = InferInsertModel<typeof schema.todEvaluations>;

export interface TestRecord extends Omit<InferSelectModel<typeof schema.testRecords>, 'evaluationAttributes' | 'testDate' | 'todPilarComments'> {
  testType: "TOD" | "TOE";
  result: "Effective" | "Ineffective";
  evaluationAttributes?: {
    objectiveAchieved: boolean;
    timingAccuracy: boolean;
    authorityCompetence: boolean;
    infoReliability: boolean;
    periodCoverage: boolean;
    evidenceAvailability: boolean;
  };
  testDate: number;
  todPilarComments?: Record<string, string>;
  samples?: TestSample[];
}

export type Notification = Omit<InferSelectModel<typeof schema.notifications>, 'createdAt'> & {
  createdAt: number;
};

