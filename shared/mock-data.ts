import type { User, Chat, ChatMessage, RCM, Control, Deficiency, ActionPlan, UserRole, Materiality, Scoping } from './types';

// --- Original Demo Data ---
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice (Line 1)', role: 'Line 1' },
  { id: 'u2', name: 'Bob (Line 2)', role: 'Line 2' },
  { id: 'u3', name: 'Charlie (Auditor)', role: 'Line 3' },
  { id: 'u4', name: 'Diana (Admin)', role: 'Admin' },
  { id: 'u5', name: 'Evan (KAP Partner)', role: 'External Auditor' },
];

export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];

// --- ICOFR Mock Data ---
export const MOCK_CONTROLS: Control[] = [
  { 
    id: 'ctrl-001', 
    rcmId: 'rcm-p2p-1', 
    code: 'P2P-01',
    name: '3-Way Match', 
    description: 'Vendor invoice is matched against purchase order and goods receipt note before payment.', 
    ownerId: 'u1', 
    type: 'Preventive', 
    nature: 'IT-Dependent', 
    frequency: 'Ad-hoc',
    assertions: ['Accuracy', 'Validity'], 
    ipos: ['Accuracy', 'Validity'],
    cosoPrinciples: [10, 11],
    riskRating: 'High',
    isKeyControl: true
  },
  { 
    id: 'ctrl-002', 
    rcmId: 'rcm-p2p-1', 
    code: 'P2P-02',
    name: 'Vendor Master Changes Review', 
    description: 'Changes to vendor master data are reviewed and approved by a manager.', 
    ownerId: 'u1', 
    type: 'Detective', 
    nature: 'Manual', 
    frequency: 'Quarterly',
    assertions: ['Accuracy', 'Completeness'], 
    ipos: ['Accuracy', 'Restricted Access'],
    cosoPrinciples: [12, 13],
    riskRating: 'Medium',
    isKeyControl: true
  },
  { 
    id: 'ctrl-003', 
    rcmId: 'rcm-r2r-1', 
    code: 'R2R-01',
    name: 'Bank Reconciliation', 
    description: 'Bank statements are reconciled with the general ledger on a monthly basis.', 
    ownerId: 'u1', 
    type: 'Detective', 
    nature: 'Manual', 
    frequency: 'Monthly',
    assertions: ['Completeness', 'Accuracy'], 
    ipos: ['Completeness', 'Accuracy'],
    cosoPrinciples: [10, 14],
    riskRating: 'High',
    isKeyControl: true
  },
];

export const MOCK_RCM: RCM[] = [
  { id: 'rcm-p2p-1', process: 'Procure-to-Pay (P2P)', subProcess: 'Invoice Processing', riskDescription: 'Risk of paying for fraudulent or inaccurate invoices.', status: 'Active', controls: ['ctrl-001', 'ctrl-002'] },
  { id: 'rcm-r2r-1', process: 'Record-to-Report (R2R)', subProcess: 'Financial Closing', riskDescription: 'Risk of inaccurate financial statements due to unreconciled cash balances.', status: 'Active', controls: ['ctrl-003'] },
];

export const MOCK_DEFICIENCIES: Deficiency[] = [
  { id: 'def-001', controlId: 'ctrl-002', description: 'Quarterly review of vendor master changes was not performed for Q2.', severity: 'Significant Deficiency', identifiedDate: Date.now() - 86400000 * 10, identifiedBy: 'u3', status: 'Open', relatedAssertions: ['Accuracy'] },
];

export const MOCK_ACTION_PLANS: ActionPlan[] = [
  { id: 'ap-001', deficiencyId: 'def-001', description: 'Perform the Q2 review retrospectively and implement a recurring calendar reminder for the process owner.', ownerId: 'u1', dueDate: Date.now() + 86400000 * 15, status: 'In Progress' },
];

export const MOCK_MATERIALITY: Materiality[] = [
  { id: 'mat-2024', year: 2024, overallMateriality: 5000000000, performanceMateriality: 3750000000, benchmark: 'Pre-Tax Income', percentage: 5, haircut: 25 }
];

export const MOCK_SCOPING: Scoping[] = [
  { id: 'scope-2024', year: 2024, significantAccounts: ['Cash', 'Accounts Receivable', 'Inventory', 'Accounts Payable'], significantLocations: ['Head Office', 'Branch A'], significantProcesses: ['Order to Cash', 'Procure to Pay', 'Financial Closing'] }
];

// --- New SK-5 Compliance Data ---

export const MOCK_APPLICATIONS: Application[] = [
  { id: 'app-sap', name: 'SAP S/4HANA', description: 'Core ERP System for Financial Reporting', statusITGC: 'Effective', criticality: 'High', lastITGCTestDate: Date.now() - 86400000 * 30 },
  { id: 'app-hris', name: 'Workday HRIS', description: 'Human Resources and Payroll Data', statusITGC: 'Ineffective', criticality: 'Medium', lastITGCTestDate: Date.now() - 86400000 * 60 },
  { id: 'app-crm', name: 'Salesforce CRM', description: 'Customer Revenue Data', statusITGC: 'Not Tested', criticality: 'Medium' },
];

export const MOCK_RISK_LIBRARY: RiskLibrary[] = [
  // Klaster Energi
  { id: 'risk-energy-01', cluster: 'Industri Energi', riskDescription: 'Kegagalan pencatatan cadangan terbukti (proven reserves) yang tidak sesuai standar PSAK/IFRS.', suggestedAssertions: ['Accuracy', 'Valuation'] },
  { id: 'risk-energy-02', cluster: 'Industri Energi', riskDescription: 'Ketidakakuratan perhitungan cost recovery pada kontrak bagi hasil.', suggestedAssertions: ['Accuracy', 'Completeness'] },
  // Klaster Keuangan
  { id: 'risk-fin-01', cluster: 'Jasa Keuangan', riskDescription: 'Kesalahan perhitungan Cadangan Kerugian Penurunan Nilai (CKPN) kredit.', suggestedAssertions: ['Valuation', 'Accuracy'] },
  { id: 'risk-fin-02', cluster: 'Jasa Keuangan', riskDescription: 'Kegagalan sistem rekonsiliasi transaksi switching antar bank.', suggestedAssertions: ['Completeness', 'Accuracy'] },
  // Klaster Umum (Cross-Industry)
  { id: 'risk-gen-01', cluster: 'Umum', riskDescription: 'Pembayaran kepada vendor fiktif atau tidak terotorisasi dalam siklus P2P.', suggestedAssertions: ['Validity', 'Existence'] },
  { id: 'risk-gen-02', cluster: 'Umum', riskDescription: 'Pengakuan pendapatan (Revenue Recognition) yang terlalu dini (Cut-off error).', suggestedAssertions: ['Cut-off', 'Occurrence'] },
];