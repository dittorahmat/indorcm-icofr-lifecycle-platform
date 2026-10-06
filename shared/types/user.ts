import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
import type { UserRole } from './common';
import type { BPMNode, BPMEdge } from './rcm-bpm';
export interface BPMDiagram extends Omit<InferSelectModel<typeof schema.bpmDiagrams>, 'nodes' | 'edges' | 'createdAt' | 'updatedAt'> {
  nodes: BPMNode[];
  edges: BPMEdge[];
  createdAt: number;
  updatedAt: number | null;
}

export type User = Omit<InferSelectModel<typeof schema.user>, 'createdAt' | 'updatedAt'> & {
  createdAt: number;
  updatedAt: number;
};

export type Chat = {
  id: string;
  title: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
};

// --- Restored & Virtual Types ---

export interface Settings {
  id: string;
  companyName: string;
  logoUrl?: string;
  ceoName: string;
  cfoName: string;
  fiscalYear: number;
  reportHeaderUrl?: string;
  isPeriodLocked: boolean;
  signedOffDate?: number;
  signedOffBy?: string;
  verificationHash?: string;
  emailProvider?: 'system' | 'smtp';
  senderEmail?: string;
  senderName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  customYears?: number[];
  slackWebhookUrl?: string;
  slackEnabled?: boolean;
  msTeamsWebhookUrl?: string;
  msTeamsEnabled?: boolean;
  genericWebhookUrl?: string;
  genericWebhookEnabled?: boolean;
}

export interface UserNotificationPreferences {
  inApp: boolean;
  email: boolean;
  slack: boolean;
  msTeams: boolean;
  genericWebhook: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  mockRole?: UserRole;
}

// --- AI & Analytics Types ---

export interface AIUseCaseStat {
  label: string;
  value: string;
  trend?: 'up' | 'down';
}

export interface AIUseCaseDrilldown {
  id: string;
  metrics: AIUseCaseStat[];
  chart: {
    type: 'bar' | 'line' | 'scatter' | 'radar';
    title: string;
    data: any[];
  };
  findings: any[]; // Table-friendly data
}

export type AIBankingData = Record<string, AIUseCaseDrilldown>;
