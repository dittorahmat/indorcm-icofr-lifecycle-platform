import type { User, Chat, ChatMessage, RCM, Control, Deficiency, ActionPlan, UserRole } from './types';
// --- Original Demo Data ---
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice (Line 1)', role: 'Line 1' },
  { id: 'u2', name: 'Bob (Line 2)', role: 'Line 2' },
  { id: 'u3', name: 'Charlie (Auditor)', role: 'Line 3' },
  { id: 'u4', name: 'Diana (Admin)', role: 'Admin' },
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
// --- ICOFR Mock Data ---
export const MOCK_CONTROLS: Control[] = [
  { id: 'ctrl-001', rcmId: 'rcm-p2p-1', name: 'P2P-01: 3-Way Match', description: 'Vendor invoice is matched against purchase order and goods receipt note before payment.', ownerId: 'u1', type: 'Preventive', nature: 'IT-Dependent', assertions: ['Accuracy', 'Validity'], materiality: 'High' },
  { id: 'ctrl-002', rcmId: 'rcm-p2p-1', name: 'P2P-02: Vendor Master Changes Review', description: 'Changes to vendor master data are reviewed and approved by a manager.', ownerId: 'u1', type: 'Detective', nature: 'Manual', assertions: ['Accuracy', 'Completeness'], materiality: 'Medium' },
  { id: 'ctrl-003', rcmId: 'rcm-r2r-1', name: 'R2R-01: Bank Reconciliation', description: 'Bank statements are reconciled with the general ledger on a monthly basis.', ownerId: 'u1', type: 'Detective', nature: 'Manual', assertions: ['Completeness', 'Accuracy'], materiality: 'High' },
];
export const MOCK_RCM: RCM[] = [
  { id: 'rcm-p2p-1', process: 'Procure-to-Pay (P2P)', subProcess: 'Invoice Processing', riskDescription: 'Risk of paying for fraudulent or inaccurate invoices.', controls: ['ctrl-001', 'ctrl-002'] },
  { id: 'rcm-r2r-1', process: 'Record-to-Report (R2R)', subProcess: 'Financial Closing', riskDescription: 'Risk of inaccurate financial statements due to unreconciled cash balances.', controls: ['ctrl-003'] },
];
export const MOCK_DEFICIENCIES: Deficiency[] = [
  { id: 'def-001', controlId: 'ctrl-002', description: 'Quarterly review of vendor master changes was not performed for Q2.', severity: 'Significant Deficiency', identifiedDate: Date.now() - 86400000 * 10, identifiedBy: 'u3', status: 'Open' },
];
export const MOCK_ACTION_PLANS: ActionPlan[] = [
  { id: 'ap-001', deficiencyId: 'def-001', description: 'Perform the Q2 review retrospectively and implement a recurring calendar reminder for the process owner.', ownerId: 'u1', dueDate: Date.now() + 86400000 * 15, status: 'In Progress' },
];