import type { User, Chat, ChatMessage, RCM, Control, Deficiency, ActionPlan, UserRole, Materiality, Scoping, Application, RiskLibrary } from './types';

// --- Original Demo Data ---
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice (Process Owner)', role: 'Line 1' },
  { id: 'u2', name: 'Bob (ICOFR Manager)', role: 'Line 2' },
  { id: 'u3', name: 'Charlie (Internal Auditor)', role: 'Line 3' },
  { id: 'u4', name: 'Diana (Admin)', role: 'Admin' },
  { id: 'u5', name: 'Evan (KAP Partner)', role: 'External Auditor' },
];

export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'ICOFR Coordination' },
  { id: 'c2', title: 'Deficiency Remediation' },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u2', text: 'Alice, please review the updated P2P BPM flow.', ts: Date.now() - 3600000 },
  { id: 'm2', chatId: 'c1', userId: 'u1', text: 'Checked. Looks good, sending for approval.', ts: Date.now() - 1800000 },
];

// --- ICOFR Mock Data ---
export const MOCK_CONTROLS: Control[] = [
  { 
    id: 'ctrl-001', 
    rcmId: 'rcm-p2p-1', 
    code: 'P2P-01',
    name: '3-Way Match Verification', 
    description: 'Sistem secara otomatis mencocokkan Vendor Invoice, Purchase Order, dan Goods Receipt sebelum pembayaran diproses.', 
    ownerId: 'u1', 
    type: 'Preventive', 
    nature: 'Automated', 
    frequency: 'Ad-hoc',
    assertions: ['Accuracy', 'Validity', 'Existence'], 
    ipos: ['Accuracy', 'Validity'],
    cosoPrinciples: [10, 11],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: true,
    itApplication: 'SAP S/4HANA'
  },
  { 
    id: 'ctrl-002', 
    rcmId: 'rcm-p2p-1', 
    code: 'P2P-02',
    name: 'Vendor Master Changes Review', 
    description: 'Setiap perubahan pada data master vendor (nama, rekening bank) direview dan disetujui oleh Accounting Manager.', 
    ownerId: 'u1', 
    type: 'Detective', 
    nature: 'Manual', 
    frequency: 'Monthly',
    assertions: ['Accuracy', 'Validity'], 
    ipos: ['Accuracy', 'Restricted Access'],
    cosoPrinciples: [12],
    riskRating: 'Medium',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: true
  },
  { 
    id: 'ctrl-003', 
    rcmId: 'rcm-r2r-1', 
    code: 'R2R-01',
    name: 'Monthly Bank Reconciliation', 
    description: 'Rekonsiliasi rekening koran dengan buku besar dilakukan setiap bulan dan disetujui oleh Controller.', 
    ownerId: 'u1', 
    type: 'Detective', 
    nature: 'Manual', 
    frequency: 'Monthly',
    assertions: ['Completeness', 'Accuracy', 'Existence'], 
    ipos: ['Completeness', 'Accuracy'],
    cosoPrinciples: [10, 14],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  { 
    id: 'ctrl-004', 
    rcmId: 'rcm-r2r-1', 
    code: 'R2R-02',
    name: 'Journal Entry Approval', 
    description: 'Semua entri jurnal manual di atas Rp 500 Juta harus mendapatkan persetujuan dari CFO.', 
    ownerId: 'u1', 
    type: 'Preventive', 
    nature: 'Manual', 
    frequency: 'Daily',
    assertions: ['Accuracy', 'Validity'], 
    ipos: ['Accuracy', 'Restricted Access'],
    cosoPrinciples: [10],
    riskRating: 'Medium',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: true
  },
  { 
    id: 'ctrl-energy-01', 
    rcmId: 'rcm-energy-1', 
    code: 'ENG-01',
    name: 'Oil & Gas Reserve Estimation Review', 
    description: 'Review tahunan atas estimasi cadangan terbukti oleh pihak ketiga independen dan tim internal.', 
    ownerId: 'u1', 
    type: 'Detective', 
    nature: 'MRC', 
    frequency: 'Annual',
    assertions: ['Valuation', 'Accuracy'], 
    ipos: ['Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    mrcMetadata: {
      expectation: "Cadangan harus sesuai dengan standar SPE-PRMS.",
      investigationThreshold: "Variasi > 10% dari tahun sebelumnya.",
      investigationProcedures: "Verifikasi asumsi geologis dan harga minyak yang digunakan."
    }
  },
];

export const MOCK_RCM: RCM[] = [
  { 
    id: 'rcm-p2p-1', 
    process: 'Procure-to-Pay (P2P)', 
    subProcess: 'Invoice Processing', 
    riskDescription: 'Risiko pembayaran fiktif atau nilai tagihan tidak sesuai yang merugikan keuangan perusahaan.', 
    status: 'Active', 
    controls: ['ctrl-001', 'ctrl-002'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Mulai', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Terima Invoice', role: 'Staff AP' } },
        { id: 'n3', type: 'risk', position: { x: 260, y: 180 }, data: { label: 'Invoice Fiktif / Salah Nilai' } },
        { id: 'n4', type: 'control', position: { x: 265, y: 280 }, data: { label: '3-Way Match System', code: 'P2P-01' } },
        { id: 'n5', type: 'end', position: { x: 250, y: 380 }, data: { label: 'Selesai', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
      ]
    }
  },
  { 
    id: 'rcm-r2r-1', 
    process: 'Record-to-Report (R2R)', 
    subProcess: 'Financial Closing', 
    riskDescription: 'Risiko salah saji laporan keuangan akibat proses penutupan buku yang tidak akurat.', 
    status: 'Active', 
    controls: ['ctrl-003', 'ctrl-004'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start Closing', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Rekonsiliasi Bank', role: 'Accounting' } },
        { id: 'n3', type: 'control', position: { x: 265, y: 180 }, data: { label: 'Review Rekonsiliasi', code: 'R2R-01' } },
        { id: 'n4', type: 'end', position: { x: 250, y: 280 }, data: { label: 'End Closing', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
      ]
    }
  },
  { 
    id: 'rcm-energy-1', 
    process: 'Upstream Operations', 
    subProcess: 'Reserve Management', 
    riskDescription: 'Kesalahan estimasi cadangan minyak mengakibatkan penilaian aset tidak wajar (Impairment).', 
    status: 'Active', 
    controls: ['ctrl-energy-01']
  }
];

export const MOCK_DEFICIENCIES: Deficiency[] = [
  { id: 'def-001', controlId: 'ctrl-002', description: 'Review perubahan data master vendor tidak dilakukan tepat waktu untuk periode Q2.', severity: 'Significant Deficiency', identifiedDate: Date.now() - 86400000 * 30, identifiedBy: 'u3', status: 'Remediated', relatedAssertions: ['Accuracy'], remediationEvidence: 'Retrospective review sign-off attached.' },
  { id: 'def-002', controlId: 'ctrl-004', description: 'Ditemukan entri jurnal manual senilai Rp 1.2 Miliar tanpa otorisasi CFO.', severity: 'Material Weakness', identifiedDate: Date.now() - 86400000 * 5, identifiedBy: 'u3', status: 'Open', relatedAssertions: ['Validity'], magnitude: 1200000000 },
];

export const MOCK_ACTION_PLANS: ActionPlan[] = [
  { id: 'ap-001', deficiencyId: 'def-001', description: 'Lakukan review retrospektif dan tambahkan kalender pengingat sistem.', ownerId: 'u1', dueDate: Date.now() - 86400000 * 2, status: 'Resolved', completionDate: Date.now() - 86400000 * 2 },
  { id: 'ap-002', deficiencyId: 'def-002', description: 'Update SOP otorisasi jurnal dan implementasi hard-lock di sistem ERP.', ownerId: 'u1', dueDate: Date.now() + 86400000 * 30, status: 'In Progress' },
];

export const MOCK_MATERIALITY: Materiality[] = [
  { 
    id: 'mat-2024', 
    year: 2024, 
    overallMateriality: 15000000000, 
    performanceMateriality: 11250000000, 
    benchmark: 'Pre-Tax Income', 
    percentage: 5, 
    haircut: 25,
    isGroupConsolidation: true,
    subsidiaryCount: 3,
    multiplier: 2.5,
    entityAllocations: [
      { entityId: 'e1', entityName: 'Anak Perusahaan A (Energi)', totalAssets: 50000000000, allocatedOM: 10000000000, allocatedPM: 7500000000 },
      { entityId: 'e2', entityName: 'Anak Perusahaan B (Logistik)', totalAssets: 30000000000, allocatedOM: 6000000000, allocatedPM: 4500000000 },
    ],
    investeeAllocations: [
      { id: 'inv-1', name: 'PT Associate Exploration', ownershipPercentage: 35, investmentValue: 5000000000, auditStatus: 'Audit Report Received', controlsTested: 'Equity Pick-up', allocatedOM: 500000000, allocatedPM: 375000000 }
    ]
  }
];

export const MOCK_SCOPING: Scoping[] = [
  { 
    id: 'scope-2024', 
    year: 2024, 
    significantAccounts: [
      { name: 'Kas dan Setara Kas', balance: 25000000000, isQuantitative: true },
      { name: 'Piutang Usaha', balance: 18000000000, isQuantitative: true },
      { name: 'Persediaan Minyak Mentah', balance: 42000000000, isQuantitative: true },
      { name: 'Aset Tetap - Kilang', balance: 150000000000, isQuantitative: true },
      { name: 'Kewajiban Imbalan Kerja', balance: 8000000000, isQuantitative: false, qualitativeReasons: ["Akun yang dipengaruhi oleh estimasi", "Akun yang memerlukan judgement tinggi"] }
    ], 
    significantLocations: ['Kantor Pusat Jakarta', 'Unit Kilang Balikpapan', 'Unit Distribusi Surabaya'], 
    significantProcesses: ['Revenue & Receivables', 'Procure to Pay', 'Oil & Gas Production', 'Financial Reporting'] 
  }
];

// --- SK-5 Compliance Data ---

export const MOCK_APPLICATIONS: Application[] = [
  { id: 'app-sap', name: 'SAP S/4HANA', description: 'Sistem ERP Utama Pelaporan Keuangan', statusITGC: 'Effective', criticality: 'High', lastITGCTestDate: Date.now() - 86400000 * 30 },
  { id: 'app-scada', name: 'SCADA Production System', description: 'Monitoring Volume Produksi Minyak', statusITGC: 'Effective', criticality: 'High', lastITGCTestDate: Date.now() - 86400000 * 15 },
  { id: 'app-hris', name: 'Workday HRIS', description: 'Data SDM dan Penggajian', statusITGC: 'Ineffective', criticality: 'Medium', lastITGCTestDate: Date.now() - 86400000 * 60 },
];

export const MOCK_RISK_LIBRARY: RiskLibrary[] = [
  // 1. Umum
  { id: 'risk-gen-01', cluster: 'Umum', riskDescription: 'Pembayaran kepada vendor fiktif atau tidak terotorisasi dalam siklus P2P.', suggestedAssertions: ['Validity', 'Existence'] },
  { id: 'risk-gen-02', cluster: 'Umum', riskDescription: 'Pengakuan pendapatan (Revenue Recognition) yang terlalu dini (Cut-off error).', suggestedAssertions: ['Cut-off', 'Occurrence'] },
  
  // 2. Industri Energi Minyak dan Gas (Lampiran 2)
  { id: 'risk-energy-01', cluster: 'Industri Energi', riskDescription: 'Kegagalan pencatatan cadangan terbukti (proven reserves) yang tidak sesuai standar PSAK/IFRS.', suggestedAssertions: ['Accuracy', 'Valuation'] },
  { id: 'risk-energy-02', cluster: 'Industri Energi', riskDescription: 'Ketidakakuratan perhitungan cost recovery pada kontrak bagi hasil.', suggestedAssertions: ['Accuracy', 'Completeness'] },
  { id: 'risk-energy-03', cluster: 'Industri Energi', riskDescription: 'Penurunan nilai aset (impairment) akibat volatilitas harga minyak dan gas.', suggestedAssertions: ['Valuation'] },
  { id: 'risk-energy-04', cluster: 'Industri Energi', riskDescription: 'Risiko kegagalan kepatuhan atas ketentuan perpajakan khusus migas (misal: PBB migas, DMO).', suggestedAssertions: ['Accuracy', 'Completeness'] },
  { id: 'risk-energy-05', cluster: 'Industri Energi', riskDescription: 'Kesalahan pengakuan kewajiban pemulihan lingkungan (AARO - Asset Retirement Obligation).', suggestedAssertions: ['Valuation', 'Completeness'] },
  { id: 'risk-energy-06', cluster: 'Industri Energi', riskDescription: 'Kecurangan (fraud) dalam pengukuran volume produksi (metering) di sumur atau terminal.', suggestedAssertions: ['Existence', 'Accuracy'] },

  // ... rest of the clusters can follow the same pattern if needed ...
];