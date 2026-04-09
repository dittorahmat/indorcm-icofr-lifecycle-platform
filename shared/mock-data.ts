import type { User, Chat, ChatMessage, RCM, Control, Deficiency, ActionPlan, UserRole, Materiality, Scoping, Application, RiskLibrary, BPMNode } from './types';

// ============================================================================
// PT BATUBARA NUSANTARA SEJAHTERA - MOCK DATA FOR COAL MINING BUMN
// ============================================================================
// Entity Profile:
// - Location: Kalimantan Timur
// - Type: Open-pit coal mining
// - Capacity: 5 million MT/year
// - Sales Mix: 70% Export, 30% Domestic (PLN)
// - Pricing: HBA (Harga Batubara Acuan)
// ============================================================================

// --- Users (Line 1/2/3, Admin, External Auditor) ---
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ahmad Fauzi (Process Owner - Mining)', role: 'Line 1' },
  { id: 'u2', name: 'Siti Nurhaliza (ICOFR Manager)', role: 'Line 2' },
  { id: 'u3', name: 'Budi Santoso (Internal Auditor)', role: 'Line 3' },
  { id: 'u4', name: 'Diana Wijaya (Admin)', role: 'Admin' },
  { id: 'u5', name: 'Evan Tan (KAP Partner)', role: 'External Auditor' },
  { id: 'u6', name: 'Hendro Wijaya (CFO)', role: 'CFO' },
  { id: 'u7', name: 'Dodi Prasetyo (Komisaris Utama)', role: 'Komisaris' },
];

// --- Chat Data ---
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'ICOFR Coordination - Coal Sales' },
  { id: 'c2', title: 'Weighbridge Calibration Issue' },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u2', text: 'Ahmad, please review the coal sales contract approval workflow.', ts: Date.now() - 3600000 },
  { id: 'm2', chatId: 'c1', userId: 'u1', text: 'Checked. The HBA pricing verification control needs update.', ts: Date.now() - 1800000 },
  { id: 'm3', chatId: 'c2', userId: 'u3', text: 'Weighbridge calibration expired last month. Need immediate action.', ts: Date.now() - 7200000 },
];

// ============================================================================
// RCM DATA - 8 CORE COAL MINING PROCESSES
// ============================================================================

export const MOCK_RCM: RCM[] = [
  {
    id: 'rcm-rev-01',
    process: 'Revenue & Receivables',
    subProcess: 'Coal Sales Contract',
    riskDescription: 'Risiko penjualan batubara tanpa kontrak yang sah atau dengan syarat kredit yang tidak layak, mengakibatkan piutang tak tertagih.',
    status: 'Active',
    controls: ['ctrl-rev-01', 'ctrl-rev-02'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Sales Order Received', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Credit Check', role: 'Finance' } },
        { id: 'n3', type: 'risk', position: { x: 260, y: 160 }, data: { label: 'Credit Risk - Bad Debt' } },
        { id: 'n4', type: 'control', position: { x: 265, y: 240 }, data: { label: 'Credit Limit Approval', code: 'FIN-01' } },
        { id: 'n5', type: 'activity', position: { x: 220, y: 320 }, data: { label: 'Prepare Sales Contract', role: 'Legal' } },
        { id: 'n6', type: 'activity', position: { x: 220, y: 400 }, data: { label: 'Contract Approval', role: 'Director' } },
        { id: 'n7', type: 'archive', position: { x: 350, y: 400 }, data: { label: 'File Contract' } },
        { id: 'n8', type: 'end', position: { x: 250, y: 480 }, data: { label: 'Contract Approved', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', target: 'n7' },
        { id: 'e6-8', source: 'n6', target: 'n8' },
      ]
    }
  },
  {
    id: 'rcm-rev-02',
    process: 'Revenue & Receivables',
    subProcess: 'Weighbridge & Quality Measurement',
    riskDescription: 'Risiko ketidakakuratan pengukuran volume dan kualitas batubara (GAR, NAR, Total Moisture, Ash) mengakibatkan kesalahan pengakuan pendapatan.',
    status: 'Active',
    controls: ['ctrl-rev-03', 'ctrl-rev-04', 'ctrl-rev-05'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Truck Arrives at Weighbridge', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Gross Weight Measurement', role: 'Weighbridge Operator' } },
        { id: 'n3', type: 'risk', position: { x: 260, y: 160 }, data: { label: 'Volume Measurement Error' } },
        { id: 'n4', type: 'control', position: { x: 265, y: 240 }, data: { label: 'Weighbridge Calibration', code: 'LOG-01' } },
        { id: 'n5', type: 'activity', position: { x: 220, y: 320 }, data: { label: 'Take Coal Sample', role: 'QC Inspector' } },
        { id: 'n6', type: 'activity', position: { x: 220, y: 400 }, data: { label: 'Lab Analysis (GAR/TM/Ash)', role: 'QC Lab' } },
        { id: 'n7', type: 'risk', position: { x: 260, y: 480 }, data: { label: 'Quality Dispute' } },
        { id: 'n8', type: 'control', position: { x: 265, y: 560 }, data: { label: 'Quality Certificate Approval', code: 'QC-01' } },
        { id: 'n9', type: 'activity', position: { x: 220, y: 640 }, data: { label: 'Issue Weight Ticket & QC Certificate', role: 'Admin' } },
        { id: 'n10', type: 'end', position: { x: 250, y: 720 }, data: { label: 'Data Recorded', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', target: 'n7' },
        { id: 'e7-8', source: 'n7', target: 'n8' },
        { id: 'e8-9', source: 'n8', target: 'n9' },
        { id: 'e9-10', source: 'n9', target: 'n10' },
      ]
    }
  },
  {
    id: 'rcm-rev-03',
    process: 'Revenue & Receivables',
    subProcess: 'Revenue Recognition - HBA Pricing',
    riskDescription: 'Risiko kesalahan perhitungan harga jual batubara berdasarkan HBA (Harga Batubara Acuan) dengan adjustment kualitas, mengakibatkan kesalahan pengakuan pendapatan.',
    status: 'Active',
    controls: ['ctrl-rev-06', 'ctrl-rev-07'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Shipment Completed', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Get HBA Price (ESDM)', role: 'Finance' } },
        { id: 'n3', type: 'activity', position: { x: 220, y: 160 }, data: { label: 'Calculate Quality Adjustment', role: 'Finance' } },
        { id: 'n4', type: 'risk', position: { x: 260, y: 240 }, data: { label: 'Pricing Error' } },
        { id: 'n5', type: 'control', position: { x: 265, y: 320 }, data: { label: 'HBA Price Verification', code: 'BILL-01' } },
        { id: 'n6', type: 'activity', position: { x: 220, y: 400 }, data: { label: 'Issue Invoice', role: 'Billing' } },
        { id: 'n7', type: 'activity', position: { x: 220, y: 480 }, data: { label: 'Revenue Recognition', role: 'Accounting' } },
        { id: 'n8', type: 'control', position: { x: 265, y: 480 }, data: { label: 'Revenue Review', code: 'ACC-01' } },
        { id: 'n9', type: 'end', position: { x: 250, y: 560 }, data: { label: 'Revenue Recorded', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', target: 'n7' },
        { id: 'e7-8', source: 'n7', target: 'n8' },
        { id: 'e8-9', source: 'n8', target: 'n9' },
      ]
    }
  },
  {
    id: 'rcm-prod-01',
    process: 'Production & Inventory',
    subProcess: 'Coal Extraction',
    riskDescription: 'Risiko ketidakakuratan pencatatan volume produksi batubara (ROM - Run of Mine) mengakibatkan salah saji persediaan dan harga pokok penjualan.',
    status: 'Active',
    controls: ['ctrl-prod-01', 'ctrl-prod-02'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Mine Plan Approved', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Overburden Removal', role: 'Contractor' } },
        { id: 'n3', type: 'activity', position: { x: 220, y: 160 }, data: { label: 'Coal Extraction', role: 'Mining Team' } },
        { id: 'n4', type: 'risk', position: { x: 260, y: 240 }, data: { label: 'Production Volume Error' } },
        { id: 'n5', type: 'control', position: { x: 265, y: 320 }, data: { label: 'Daily Production Report', code: 'PROD-01' } },
        { id: 'n6', type: 'activity', position: { x: 220, y: 400 }, data: { label: 'Stockpile Recording', role: 'Logistics' } },
        { id: 'n7', type: 'end', position: { x: 250, y: 480 }, data: { label: 'ROM Recorded', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', target: 'n7' },
      ]
    }
  },
  {
    id: 'rcm-prod-02',
    process: 'Production & Inventory',
    subProcess: 'Stockpile Management',
    riskDescription: 'Risiko perbedaan signifikan antara catatan stockpile dengan hasil survey (drone/manual) mengakibatkan salah saji persediaan batubara.',
    status: 'Active',
    controls: ['ctrl-prod-03', 'ctrl-prod-04'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'ROM Delivered to Stockpile', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Stockpile Recording', role: 'Warehouse' } },
        { id: 'n3', type: 'activity', position: { x: 220, y: 160 }, data: { label: 'Monthly Drone Survey', role: 'Survey Team' } },
        { id: 'n4', type: 'risk', position: { x: 260, y: 240 }, data: { label: 'Stockpile Variance' } },
        { id: 'n5', type: 'control', position: { x: 265, y: 320 }, data: { label: 'Variance Analysis', code: 'LOG-02' } },
        { id: 'n6', type: 'activity', position: { x: 220, y: 400 }, data: { label: 'Adjustment if needed', role: 'Accounting' } },
        { id: 'n7', type: 'end', position: { x: 250, y: 480 }, data: { label: 'Stockpile Updated', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', target: 'n7' },
      ]
    }
  },
  {
    id: 'rcm-proc-01',
    process: 'Procure to Pay',
    subProcess: 'Mining Contractor Services',
    riskDescription: 'Risiko pembayaran kepada kontraktor tambang tanpa verifikasi pekerjaan yang memadai, mengakibatkan pembayaran berlebih atau fiktif.',
    status: 'Active',
    controls: ['ctrl-proc-01', 'ctrl-proc-02', 'ctrl-proc-03'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Service Request', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Contractor Selection', role: 'Procurement' } },
        { id: 'n3', type: 'activity', position: { x: 220, y: 160 }, data: { label: 'Service Execution', role: 'Contractor' } },
        { id: 'n4', type: 'activity', position: { x: 220, y: 240 }, data: { label: 'Work Verification', role: 'Engineering' } },
        { id: 'n5', type: 'risk', position: { x: 260, y: 320 }, data: { label: 'Work Not Performed' } },
        { id: 'n6', type: 'control', position: { x: 265, y: 400 }, data: { label: 'Work Certificate', code: 'ENG-01' } },
        { id: 'n7', type: 'activity', position: { x: 220, y: 480 }, data: { label: 'Invoice Approval', role: 'Finance' } },
        { id: 'n8', type: 'activity', position: { x: 220, y: 560 }, data: { label: 'Payment Processing', role: 'Finance' } },
        { id: 'n9', type: 'end', position: { x: 250, y: 640 }, data: { label: 'Payment Completed', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', target: 'n7' },
        { id: 'e7-8', source: 'n7', target: 'n8' },
        { id: 'e8-9', source: 'n8', target: 'n9' },
      ]
    }
  },
  {
    id: 'rcm-fa-01',
    process: 'Fixed Assets & Capex',
    subProcess: 'Mine Development Capitalization',
    riskDescription: 'Risiko salah klasifikasi antara biaya kapital (capex) dan biaya operasional (opex) untuk overburden removal costs dan mine development, mengakibatkan salah saji aset dan beban.',
    status: 'Active',
    controls: ['ctrl-fa-01', 'ctrl-fa-02'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Project Proposal', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'Capex Budget Approval', role: 'Management' } },
        { id: 'n3', type: 'activity', position: { x: 220, y: 160 }, data: { label: 'Construction/Development', role: 'Engineering' } },
        { id: 'n4', type: 'activity', position: { x: 220, y: 240 }, data: { label: 'Cost Capitalization Review', role: 'Accounting' } },
        { id: 'n5', type: 'risk', position: { x: 260, y: 320 }, data: { label: 'Capex vs Opex Error' } },
        { id: 'n6', type: 'control', position: { x: 265, y: 400 }, data: { label: 'Capitalization Criteria', code: 'ACC-02' } },
        { id: 'n7', type: 'activity', position: { x: 220, y: 480 }, data: { label: 'Asset Registration', role: 'FA Admin' } },
        { id: 'n8', type: 'end', position: { x: 250, y: 560 }, data: { label: 'Asset Capitalized', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', target: 'n7' },
        { id: 'e7-8', source: 'n7', target: 'n8' },
      ]
    }
  },
  {
    id: 'rcm-env-01',
    process: 'Reclamation & Environmental',
    subProcess: 'ARO Provision Calculation',
    riskDescription: 'Risiko kesalahan pengakuan kewajiban pemulihan lingkungan (Asset Retirement Obligation - AARO) yang tidak sesuai PSAK, mengakibatkan salah saji liabilitas dan beban.',
    status: 'Active',
    controls: ['ctrl-env-01', 'ctrl-env-02'],
    bpmData: {
      nodes: [
        { id: 'n1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Mine Plan Review', type: 'start' } },
        { id: 'n2', type: 'activity', position: { x: 220, y: 80 }, data: { label: 'ARO Calculation', role: 'Engineering' } },
        { id: 'n3', type: 'activity', position: { x: 220, y: 160 }, data: { label: 'Third-party Verification', role: 'Consultant' } },
        { id: 'n4', type: 'risk', position: { x: 260, y: 240 }, data: { label: 'ARO Understated' } },
        { id: 'n5', type: 'control', position: { x: 265, y: 320 }, data: { label: 'ARO Methodology Review', code: 'TECH-01' } },
        { id: 'n6', type: 'activity', position: { x: 220, y: 400 }, data: { label: 'Provision Booking', role: 'Accounting' } },
        { id: 'n7', type: 'activity', position: { x: 220, y: 480 }, data: { label: 'Annual Review', role: 'Management' } },
        { id: 'n8', type: 'end', position: { x: 250, y: 560 }, data: { label: 'ARO Recorded', type: 'end' } },
      ],
      edges: [
        { id: 'e1-2', source: 'n1', target: 'n2' },
        { id: 'e2-3', source: 'n2', target: 'n3' },
        { id: 'e3-4', source: 'n3', target: 'n4' },
        { id: 'e4-5', source: 'n4', target: 'n5' },
        { id: 'e5-6', source: 'n5', target: 'n6' },
        { id: 'e6-7', source: 'n6', target: 'n7' },
        { id: 'e7-8', source: 'n7', target: 'n8' },
      ]
    }
  },
];

// ============================================================================
// CONTROLS DATA - 25-30 CONTROLS (All Types)
// ============================================================================

export const MOCK_CONTROLS: Control[] = [
  // Revenue Controls (7 controls)
  {
    id: 'ctrl-rev-01',
    rcmId: 'rcm-rev-01',
    code: 'FIN-01',
    name: 'Credit Limit Approval',
    description: 'Semua penjualan batubara kepada customer baru harus mendapatkan persetujuan credit limit dari Finance Manager berdasarkan analisis kreditworthiness.',
    ownerId: 'u2',
    type: 'Preventive',
    nature: 'Manual',
    frequency: 'Ad-hoc',
    assertions: ['Validity', 'Accuracy'],
    ipos: ['Validity', 'Restricted Access'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itApplication: 'SAP S/4HANA'
  },
  {
    id: 'ctrl-rev-02',
    rcmId: 'rcm-rev-01',
    code: 'LEGAL-01',
    name: 'Sales Contract Legal Review',
    description: 'Kontrak penjualan batubara harus direview oleh Legal Department untuk memastikan compliance dengan regulasi dan perlindungan hukum perusahaan.',
    ownerId: 'u1',
    type: 'Preventive',
    nature: 'Manual',
    frequency: 'Ad-hoc',
    assertions: ['Validity', 'Completeness'],
    ipos: ['Validity'],
    cosoPrinciples: [12],
    riskRating: 'Medium',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  {
    id: 'ctrl-rev-03',
    rcmId: 'rcm-rev-02',
    code: 'LOG-01',
    name: 'Weighbridge Calibration',
    description: 'Weighbridge harus dikalibrasi setiap bulan oleh pihak ketiga bersertifikat untuk memastikan akurasi pengukuran volume batubara.',
    ownerId: 'u1',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Monthly',
    assertions: ['Accuracy', 'Completeness'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10, 14],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itApplication: 'Weighbridge System'
  },
  {
    id: 'ctrl-rev-04',
    rcmId: 'rcm-rev-02',
    code: 'QC-01',
    name: 'Quality Certificate Approval',
    description: 'Sertifikat kualitas batubara (GAR, NAR, Total Moisture, Ash) harus disetujui oleh QC Manager sebelum diterbitkan kepada customer.',
    ownerId: 'u1',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Daily',
    assertions: ['Accuracy'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itApplication: 'QC Lab System'
  },
  {
    id: 'ctrl-rev-05',
    rcmId: 'rcm-rev-02',
    code: 'LOG-02',
    name: 'Weighbridge Reconciliation',
    description: 'Rekonsiliasi harian antara hasil weighbridge dengan stockpile movement untuk mendeteksi selisih volume.',
    ownerId: 'u1',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Daily',
    assertions: ['Completeness', 'Accuracy'],
    ipos: ['Completeness', 'Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'Medium',
    isKeyControl: false,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  {
    id: 'ctrl-rev-06',
    rcmId: 'rcm-rev-03',
    code: 'BILL-01',
    name: 'HBA Price Verification',
    description: 'Harga HBA (Harga Batubara Acuan) yang digunakan untuk invoice harus diverifikasi dengan website resmi Kementerian ESDM sebelum billing.',
    ownerId: 'u2',
    type: 'Preventive',
    nature: 'Manual',
    frequency: 'Daily',
    assertions: ['Accuracy'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  {
    id: 'ctrl-rev-07',
    rcmId: 'rcm-rev-03',
    code: 'ACC-01',
    name: 'Revenue Recognition Review',
    description: 'Jurnal pengakuan pendapatan harus direview dan disetujui oleh Accounting Manager untuk memastikan cut-off yang tepat dan compliance dengan PSAK.',
    ownerId: 'u2',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Daily',
    assertions: ['Cut-off', 'Accuracy', 'Completeness'],
    ipos: ['Accuracy', 'Completeness'],
    cosoPrinciples: [10, 14],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itApplication: 'SAP S/4HANA'
  },
  
  // Production Controls (4 controls)
  {
    id: 'ctrl-prod-01',
    rcmId: 'rcm-prod-01',
    code: 'PROD-01',
    name: 'Daily Production Report',
    description: 'Laporan produksi harian batubara (ROM) harus disetujui oleh Mine Manager dan direkonsiliasi dengan stockpile movement.',
    ownerId: 'u1',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Daily',
    assertions: ['Completeness', 'Accuracy'],
    ipos: ['Completeness', 'Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'Medium',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  {
    id: 'ctrl-prod-02',
    rcmId: 'rcm-prod-01',
    code: 'SCADA-01',
    name: 'Production Monitoring System (SCADA)',
    description: 'Sistem SCADA memonitor volume produksi batubara secara real-time dan alert jika ada deviasi signifikan dari target.',
    ownerId: 'u1',
    type: 'Detective',
    nature: 'Automated',
    frequency: 'Daily',
    assertions: ['Completeness', 'Accuracy'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'Medium',
    isKeyControl: false,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itApplication: 'SCADA Production System'
  },
  {
    id: 'ctrl-prod-03',
    rcmId: 'rcm-prod-02',
    code: 'LOG-03',
    name: 'Monthly Stockpile Survey',
    description: 'Survey stockpile batubara menggunakan drone dilakukan setiap bulan oleh surveyor independen untuk memverifikasi volume tercatat.',
    ownerId: 'u1',
    type: 'Detective',
    nature: 'MRC',
    frequency: 'Monthly',
    assertions: ['Existence', 'Accuracy', 'Completeness'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    mrcMetadata: {
      expectation: 'Variance antara survey dan catatan < 5%',
      investigationThreshold: 'Variance > 5% dari recorded volume',
      investigationProcedures: 'Review weighing records, check for measurement errors, investigate potential theft'
    }
  },
  {
    id: 'ctrl-prod-04',
    rcmId: 'rcm-prod-02',
    code: 'ACC-03',
    name: 'Stockpile Variance Analysis',
    description: 'Analisis variance antara hasil survey stockpile dengan catatan sistem. Variance > 5% harus diinvestigasi dan disesuaikan dengan persetujuan Management.',
    ownerId: 'u2',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Monthly',
    assertions: ['Accuracy', 'Valuation'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10, 14],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  
  // Procurement Controls (3 controls)
  {
    id: 'ctrl-proc-01',
    rcmId: 'rcm-proc-01',
    code: 'PROC-01',
    name: 'Contractor Pre-qualification',
    description: 'Semua kontraktor tambang harus melalui proses pre-qualification termasuk verifikasi资质, safety record, dan financial capability.',
    ownerId: 'u1',
    type: 'Preventive',
    nature: 'Manual',
    frequency: 'Annual',
    assertions: ['Validity'],
    ipos: ['Validity'],
    cosoPrinciples: [10],
    riskRating: 'Medium',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  {
    id: 'ctrl-proc-02',
    rcmId: 'rcm-proc-01',
    code: 'ENG-01',
    name: 'Work Completion Certificate',
    description: 'Pekerjaan kontraktor tambang harus diverifikasi oleh Engineering Department dengan menerbitkan Work Completion Certificate sebelum invoice diproses.',
    ownerId: 'u1',
    type: 'Preventive',
    nature: 'Manual',
    frequency: 'Ad-hoc',
    assertions: ['Validity', 'Occurrence'],
    ipos: ['Validity'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: true
  },
  {
    id: 'ctrl-proc-03',
    rcmId: 'rcm-proc-01',
    code: 'PROC-02',
    name: 'Three-Way Match',
    description: 'Invoice kontraktor harus match dengan Purchase Order, Work Completion Certificate, dan GR (Goods Receipt) sebelum pembayaran diproses.',
    ownerId: 'u2',
    type: 'Preventive',
    nature: 'Automated',
    frequency: 'Ad-hoc',
    assertions: ['Validity', 'Accuracy'],
    ipos: ['Validity', 'Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: true,
    itApplication: 'SAP S/4HANA'
  },
  
  // Fixed Assets Controls (2 controls)
  {
    id: 'ctrl-fa-01',
    rcmId: 'rcm-fa-01',
    code: 'MGMT-01',
    name: 'Capex Budget Approval',
    description: 'Budget capex untuk mine development harus disetujui oleh Board of Directors. Perubahan budget > 10% memerlukan re-approval.',
    ownerId: 'u4',
    type: 'Preventive',
    nature: 'Manual',
    frequency: 'Annual',
    assertions: ['Validity', 'Accuracy'],
    ipos: ['Validity', 'Restricted Access'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  {
    id: 'ctrl-fa-02',
    rcmId: 'rcm-fa-01',
    code: 'ACC-02',
    name: 'Capitalization Criteria Review',
    description: 'Review berkala atas kapitalisasi biaya mine development untuk memastikan compliance dengan PSAK 18 (Aset Tetap) dan PSAK 56 (Biaya Pengupasan Tanah).',
    ownerId: 'u2',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Quarterly',
    assertions: ['Accuracy', 'Classification'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10, 14],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  
  // Environmental Controls (2 controls)
  {
    id: 'ctrl-env-01',
    rcmId: 'rcm-env-01',
    code: 'TECH-01',
    name: 'ARO Methodology Approval',
    description: 'Metodologi perhitungan ARO (discount rate, reclamation cost estimate, timeline) harus disetujui oleh Management dan direview oleh third-party consultant.',
    ownerId: 'u2',
    type: 'Preventive',
    nature: 'MRC',
    frequency: 'Annual',
    assertions: ['Valuation', 'Completeness'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    mrcMetadata: {
      expectation: 'ARO provision mencerminkan present value dari estimated reclamation costs',
      investigationThreshold: 'Perubahan estimated cost > 10% dari previous estimate',
      investigationProcedures: 'Review mine plan updates, verify discount rate, compare with industry benchmarks'
    }
  },
  {
    id: 'ctrl-env-02',
    rcmId: 'rcm-env-01',
    code: 'ENV-01',
    name: 'ARO Provision Review',
    description: 'Provisi ARO harus direview setiap tahun oleh Management dan disesuaikan dengan perubahan mine plan, biaya estimasi, atau regulasi lingkungan.',
    ownerId: 'u2',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Annual',
    assertions: ['Valuation', 'Completeness'],
    ipos: ['Accuracy', 'Completeness'],
    cosoPrinciples: [10, 14],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false
  },
  
  // ITGC Controls (4 controls)
  {
    id: 'ctrl-it-01',
    rcmId: 'rcm-rev-01',
    code: 'ITGC-01',
    name: 'SAP User Access Review',
    description: 'Review berkala atas user access SAP S/4HANA untuk memastikan segregation of duties dan removal access untuk terminated employees.',
    ownerId: 'u4',
    type: 'Detective',
    nature: 'Manual',
    frequency: 'Quarterly',
    assertions: ['Validity', 'Restricted Access'],
    ipos: ['Restricted Access'],
    cosoPrinciples: [10],
    riskRating: 'High',
    isKeyControl: true,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itgcArea: 'Access to Program and Data',
    itApplication: 'SAP S/4HANA'
  },
  {
    id: 'ctrl-it-02',
    rcmId: 'rcm-rev-02',
    code: 'ITGC-02',
    name: 'Weighbridge System Change Control',
    description: 'Perubahan konfigurasi sistem weighbridge harus melalui proses change control dengan approval dari IT Manager dan user owner.',
    ownerId: 'u4',
    type: 'Preventive',
    nature: 'Manual',
    frequency: 'Ad-hoc',
    assertions: ['Accuracy', 'Validity'],
    ipos: ['Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'Medium',
    isKeyControl: false,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itgcArea: 'Program Changes',
    itApplication: 'Weighbridge System'
  },
  {
    id: 'ctrl-it-03',
    rcmId: 'rcm-prod-01',
    code: 'ITGC-03',
    name: 'SCADA System Backup',
    description: 'Backup harian atas data produksi dari SCADA system untuk memastikan availability dan recoverability data.',
    ownerId: 'u4',
    type: 'Preventive',
    nature: 'Automated',
    frequency: 'Daily',
    assertions: ['Completeness', 'Availability'],
    ipos: ['Completeness'],
    cosoPrinciples: [10],
    riskRating: 'Medium',
    isKeyControl: false,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itgcArea: 'Computer Operations',
    itApplication: 'SCADA Production System'
  },
  {
    id: 'ctrl-it-04',
    rcmId: 'rcm-rev-03',
    code: 'ITGC-04',
    name: 'SAP Interface Control (Billing to AR)',
    description: 'Rekonsiliasi otomatis antara billing system dengan SAP AR module untuk memastikan completeness dan accuracy data.',
    ownerId: 'u2',
    type: 'Detective',
    nature: 'Automated',
    frequency: 'Daily',
    assertions: ['Completeness', 'Accuracy'],
    ipos: ['Completeness', 'Accuracy'],
    cosoPrinciples: [10],
    riskRating: 'Medium',
    isKeyControl: false,
    effectiveDate: Date.now() - 31536000000,
    isFraudRisk: false,
    itgcArea: 'Computer Operations',
    itApplication: 'SAP S/4HANA'
  },
];

// ============================================================================
// DEFICIENCIES DATA - 5-7 REALISTIC SCENARIOS
// ============================================================================

export const MOCK_DEFICIENCIES: Deficiency[] = [
  {
    id: 'def-001',
    controlId: 'ctrl-rev-03',
    description: 'Kalibrasi weighbridge expired sejak 2 bulan yang lalu. Sertifikat kalibrasi terakhir tanggal 30 September 2024, seharusnya renew setiap bulan.',
    severity: 'Significant Deficiency',
    identifiedDate: Date.now() - 86400000 * 60,
    identifiedBy: 'u3',
    status: 'Open',
    relatedAssertions: ['Accuracy', 'Completeness'],
    magnitude: 5000000000 // Rp 5B potential revenue impact
  },
  {
    id: 'def-002',
    controlId: 'ctrl-rev-07',
    description: 'Ditemukan pengakuan pendapatan untuk shipment tanggal 28 Desember 2024 dicatat di Januari 2025 (cut-off error). Total nilai: Rp 12.5B.',
    severity: 'Material Weakness',
    identifiedDate: Date.now() - 86400000 * 15,
    identifiedBy: 'u3',
    status: 'Open',
    relatedAssertions: ['Cut-off', 'Accuracy'],
    magnitude: 12500000000 // Rp 12.5B
  },
  {
    id: 'def-003',
    controlId: 'ctrl-prod-03',
    description: 'Variance stockpile survey bulan November 2024 sebesar 8% (40,000 MT) tidak diinvestigasi dan tidak disesuaikan. Melampaui threshold 5%.',
    severity: 'Significant Deficiency',
    identifiedDate: Date.now() - 86400000 * 45,
    identifiedBy: 'u3',
    status: 'In Progress',
    relatedAssertions: ['Existence', 'Accuracy', 'Valuation'],
    magnitude: 4000000000 // Rp 4B inventory impact
  },
  {
    id: 'def-004',
    controlId: 'ctrl-env-02',
    description: 'Provisi ARO tidak diupdate selama 3 tahun terakhir meskipun ada perubahan signifikan atas mine plan dan estimated reclamation costs. Potential understatement: Rp 25B.',
    severity: 'Material Weakness',
    identifiedDate: Date.now() - 86400000 * 30,
    identifiedBy: 'u5',
    status: 'Open',
    relatedAssertions: ['Valuation', 'Completeness'],
    magnitude: 25000000000 // Rp 25B
  },
  {
    id: 'def-005',
    controlId: 'ctrl-proc-02',
    description: 'Ditemukan invoice kontraktor mining senilai Rp 3.2B dibayar tanpa Work Completion Certificate yang ditandatangani. Pembayaran dilakukan berdasarkan email approval saja.',
    severity: 'Significant Deficiency',
    identifiedDate: Date.now() - 86400000 * 20,
    identifiedBy: 'u3',
    status: 'Remediated',
    relatedAssertions: ['Validity', 'Occurrence'],
    magnitude: 3200000000, // Rp 3.2B
    remediationEvidence: 'Work Completion Certificate retrospective approval obtained. New SOP implemented for mandatory certificate before payment.'
  },
  {
    id: 'def-006',
    controlId: 'ctrl-fa-02',
    description: 'Biaya overburden removal senilai Rp 18B dikapitalisasi sebagai mine development, padahal seharusnya expensed sebagai operating cost sesuai PSAK 56.',
    severity: 'Significant Deficiency',
    identifiedDate: Date.now() - 86400000 * 25,
    identifiedBy: 'u5',
    status: 'Open',
    relatedAssertions: ['Classification', 'Accuracy', 'Valuation'],
    magnitude: 18000000000 // Rp 18B
  },
  {
    id: 'def-007',
    controlId: 'ctrl-it-01',
    description: 'Ditemukan 5 user SAP dari terminated employees masih memiliki active access setelah 3 bulan keluar. Tidak ada process untuk removal access otomatis.',
    severity: 'Control Deficiency',
    identifiedDate: Date.now() - 86400000 * 10,
    identifiedBy: 'u3',
    status: 'In Progress',
    relatedAssertions: ['Restricted Access'],
    magnitude: 0 // ITGC deficiency - indirect impact
  },
];

// ============================================================================
// ACTION PLANS DATA
// ============================================================================

export const MOCK_ACTION_PLANS: ActionPlan[] = [
  {
    id: 'ap-001',
    deficiencyId: 'def-001',
    description: 'Segera lakukan kalibrasi weighbridge dengan pihak ketiga bersertifikat. Implement reminder system untuk tracking expiry date kalibrasi.',
    ownerId: 'u1',
    dueDate: Date.now() + 86400000 * 15,
    status: 'In Progress'
  },
  {
    id: 'ap-002',
    deficiencyId: 'def-002',
    description: 'Adjusting journal entry untuk koreksi cut-off revenue. Review semua shipment di akhir periode untuk memastikan cut-off yang tepat.',
    ownerId: 'u2',
    dueDate: Date.now() + 86400000 * 30,
    status: 'In Progress'
  },
  {
    id: 'ap-003',
    deficiencyId: 'def-003',
    description: 'Investigasi root cause variance stockpile 8%. Lakukan adjustment jika diperlukan. Improve frequency survey dari bulanan ke mingguan.',
    ownerId: 'u1',
    dueDate: Date.now() + 86400000 * 45,
    status: 'Draft'
  },
  {
    id: 'ap-004',
    deficiencyId: 'def-004',
    description: 'Engage third-party consultant untuk update ARO calculation. Booking adjusting journal untuk additional provision. Update methodology review menjadi annual.',
    ownerId: 'u2',
    dueDate: Date.now() + 86400000 * 90,
    status: 'Draft'
  },
  {
    id: 'ap-005',
    deficiencyId: 'def-005',
    description: 'Update SOP pembayaran kontraktor untuk mandatory Work Completion Certificate. Training untuk Finance dan Engineering team.',
    ownerId: 'u2',
    dueDate: Date.now() - 86400000 * 5,
    status: 'Resolved',
    completionDate: Date.now() - 86400000 * 5
  },
  {
    id: 'ap-006',
    deficiencyId: 'def-006',
    description: 'Reclassify biaya overburden removal dari capex ke opex. Engage external auditor untuk review accounting treatment. Update capitalization policy.',
    ownerId: 'u2',
    dueDate: Date.now() + 86400000 * 60,
    status: 'In Progress'
  },
  {
    id: 'ap-007',
    deficiencyId: 'def-007',
    description: 'Disable access untuk 5 terminated users. Implement automated HR-IT integration untuk removal access saat employee exit.',
    ownerId: 'u4',
    dueDate: Date.now() + 86400000 * 7,
    status: 'In Progress'
  },
];

// ============================================================================
// MATERIALITY & SCOPING DATA
// ============================================================================

export const MOCK_MATERIALITY: Materiality[] = [
  {
    id: 'mat-2024',
    year: 2024,
    overallMateriality: 17500000000, // Rp 17.5B (5% of Pre-Tax Income Rp 345.3B from GL.csv)
    performanceMateriality: 13125000000, // Rp 13.125B (75% of OM, 25% haircut)
    benchmark: 'Pre-Tax Income',
    percentage: 5,
    haircut: 25,
    isGroupConsolidation: false,
    subsidiaryCount: 1,
    multiplier: 1,
    entityAllocations: [],
    investeeAllocations: [],
    // Calculation from Sample Data GL.csv:
    // Revenue (601xxxx): Rp 345,324,452,000
    // COGS (602xxxx): Rp 45,079,200
    // Operating Expenses (603xxxx): Rp 0
    // Pre-Tax Income: Rp 345,279,372,800
    // OM: Rp 345.3B × 5% = Rp 17.26B → rounded to Rp 17.5B
    // PM: Rp 17.5B × 75% = Rp 13.125B
  }
];

export const MOCK_SCOPING: Scoping[] = [
  {
    id: 'scope-2024',
    year: 2024,
    significantAccounts: [
      { name: 'Kas dan Bank (1010100)', balance: 11622215994, isQuantitative: true, fsliCode: '1010100' },
      { name: 'Piutang Usaha - PT AAA (1010201)', balance: 91285215502, isQuantitative: true, fsliCode: '1010201' },
      { name: 'Piutang Usaha - PT BBB (1010202)', balance: 115576724009, isQuantitative: true, fsliCode: '1010202' },
      { name: 'Persediaan Barang Hasil Tambang (1011000)', balance: 47357831548, isQuantitative: true, fsliCode: '1011000' },
      { name: 'Uang Muka Sewa (1011200)', balance: 27729993950, isQuantitative: true, fsliCode: '1011200' },
      { name: 'Hutang Usaha - Pihak Berelasi (1020501)', balance: 125751000000, isQuantitative: true, fsliCode: '1020501' },
      { name: 'Aset Pajak Tangguhan (1021400)', balance: 85200765236, isQuantitative: true, fsliCode: '1021400' },
      { name: 'Pendapatan - Export & Domestic (6010000)', balance: 345324452000, isQuantitative: true, fsliCode: '6010000' },
      { name: 'Beban Pokok Pendapatan (6100000)', balance: 94245245545, isQuantitative: true, fsliCode: '6100000' },
      { name: 'Beban Umum dan Administrasi (6120000)', balance: 3452434500, isQuantitative: false, qualitativeReasons: ['Akun dengan volume transaksi tinggi', 'Meliputi berbagai jenis beban operasional'] },
      { name: 'Beban Royalty ( implied dari HPP)', balance: 17500000000, isQuantitative: false, qualitativeReasons: ['Akun yang dipengaruhi oleh regulasi pemerintah', 'Kompleksitas perhitungan DMO vs export'] },
      { name: 'Beban Lain-Lain (6360000)', balance: 4979000044, isQuantitative: false, qualitativeReasons: ['Memerlukan review untuk klasifikasi yang tepat', 'Potensi misclassification ke expense accounts lain'] }
    ],
    significantLocations: ['Mine Site - Kalimantan Timur', 'Stockpile & Port Facility', 'Kantor Pusat Jakarta'],
    significantProcesses: ['Revenue & Receivables', 'Production & Inventory', 'Procure to Pay', 'Fixed Assets & Capex', 'Reclamation & Environmental']
  }
];

// ============================================================================
// APPLICATIONS & RISK LIBRARY
// ============================================================================

export const MOCK_APPLICATIONS: Application[] = [
  { id: 'app-sap', name: 'SAP S/4HANA', description: 'Sistem ERP untuk financial accounting, sales, procurement', statusITGC: 'Effective', criticality: 'High', lastITGCTestDate: Date.now() - 86400000 * 30 },
  { id: 'app-weighbridge', name: 'Weighbridge Management System', description: 'Sistem manajemen penimbangan batubara', statusITGC: 'Effective', criticality: 'High', lastITGCTestDate: Date.now() - 86400000 * 45 },
  { id: 'app-scada', name: 'SCADA Production System', description: 'Monitoring volume produksi batubara real-time', statusITGC: 'Effective', criticality: 'High', lastITGCTestDate: Date.now() - 86400000 * 60 },
  { id: 'app-qclab', name: 'QC Lab Information System', description: 'Manajemen data kualitas batubara (GAR, NAR, TM, Ash)', statusITGC: 'Effective', criticality: 'Medium', lastITGCTestDate: Date.now() - 86400000 * 90 },
];

export const MOCK_RISK_LIBRARY: RiskLibrary[] = [
  // Reserve Estimation Risks (3)
  { id: 'risk-coal-01', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Kegagalan pencatatan cadangan batubara (coal reserves) yang tidak sesuai standar KCMI/JORC.', suggestedAssertions: ['Accuracy', 'Valuation', 'Completeness'] },
  { id: 'risk-coal-02', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Ketidakakuratan estimasi volume dan kualitas batubara berdasarkan studi feasibilitas.', suggestedAssertions: ['Accuracy', 'Valuation'] },
  { id: 'risk-coal-03', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Perubahan signifikan atas estimasi cadangan akibat update geological model tanpa dokumentasi memadai.', suggestedAssertions: ['Completeness', 'Accuracy'] },
  
  // Production Measurement Risks (3)
  { id: 'risk-coal-04', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Ketidakakuratan pengukuran volume produksi batubara (weighbridge, stockpile survey).', suggestedAssertions: ['Accuracy', 'Completeness'] },
  { id: 'risk-coal-05', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Perbedaan signifikan antara hasil stockpile survey (drone) dengan catatan sistem.', suggestedAssertions: ['Accuracy', 'Existence'] },
  { id: 'risk-coal-06', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Kesalahan penentuan moisture content mengakibatkan overstatement clean coal production.', suggestedAssertions: ['Accuracy', 'Valuation'] },
  
  // Revenue Recognition Risks (4)
  { id: 'risk-coal-07', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Pengakuan pendapatan (revenue recognition) yang terlalu dini sebelum pemenuhan kewajiban performa (transfer of control).', suggestedAssertions: ['Cut-off', 'Occurrence'] },
  { id: 'risk-coal-08', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Kesalahan perhitungan harga jual batubara berdasarkan HBA (Harga Batubara Acuan) dengan adjustment kualitas (GAR, NAR, Total Moisture, Ash).', suggestedAssertions: ['Accuracy', 'Valuation'] },
  { id: 'risk-coal-09', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Pendapatan dari penjualan batubara ke pihak berelasi (related party) tidak diungkapkan secara memadai.', suggestedAssertions: ['Presentation', 'Completeness'] },
  { id: 'risk-coal-10', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Selisih kurs mata uang asing atas penjualan ekspor tidak diakui dengan benar.', suggestedAssertions: ['Accuracy', 'Completeness'] },
  
  // Cost Classification Risks (3)
  { id: 'risk-coal-11', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Salah klasifikasi antara biaya kapital (capex) dan biaya operasional (opex) untuk overburden removal costs.', suggestedAssertions: ['Classification', 'Accuracy'] },
  { id: 'risk-coal-12', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Biaya pengembangan tambang (mine development) tidak dikapitalisasi dengan benar sesuai PSAK.', suggestedAssertions: ['Accuracy', 'Classification'] },
  { id: 'risk-coal-13', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Biaya reklamasi yang seharusnya menjadi provisi (ARO) diakui sebagai beban periode berjalan.', suggestedAssertions: ['Classification', 'Completeness'] },
  
  // Reclamation Provision Risks (3)
  { id: 'risk-coal-14', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Kesalahan pengakuan kewajiban pemulihan lingkungan (Asset Retirement Obligation - AARO) yang tidak sesuai PSAK.', suggestedAssertions: ['Valuation', 'Completeness'] },
  { id: 'risk-coal-15', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Provisi reklamasi (reclamation provision) tidak diperbarui sesuai perubahan rencana reklamasi dan biaya estimasi.', suggestedAssertions: ['Valuation', 'Completeness'] },
  { id: 'risk-coal-16', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Biaya reklamasi progresif tidak dicatat sebagai pengurang provisi reklamasi.', suggestedAssertions: ['Completeness', 'Accuracy'] },
  
  // Royalty & Tax Compliance Risks (3)
  { id: 'risk-coal-17', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Perhitungan dan pembayaran royalty produksi batubara tidak sesuai dengan ketentuan pemerintah (Permen ESDM).', suggestedAssertions: ['Accuracy', 'Completeness'] },
  { id: 'risk-coal-18', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Alokasi penjualan batubara antara DMO (Domestic Market Obligation) dan ekspor tidak dihitung dengan benar, mengakibatkan kesalahan perhitungan royalty.', suggestedAssertions: ['Accuracy', 'Completeness'] },
  { id: 'risk-coal-19', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Kewajiban perpajakan khusus pertambangan (PPh pasal 22, royalty deductible) tidak dihitung dan disetor dengan benar.', suggestedAssertions: ['Accuracy', 'Completeness'] },
  
  // Environmental Compliance Risks (3)
  { id: 'risk-coal-20', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Kegagalan kepatuhan terhadap ketentuan lingkungan hidup (AMDAL, UKL-UPL) mengakibatkan sanksi administratif atau denda.', suggestedAssertions: ['Completeness', 'Occurrence'] },
  { id: 'risk-coal-21', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Tidak terdapat persetujuan/revisi AMDAL untuk perluasan area tambang.', suggestedAssertions: ['Completeness', 'Occurrence'] },
  { id: 'risk-coal-22', cluster: 'Industri Mineral dan Batubara', riskDescription: 'Kewajiban pelaporan lingkungan triwulanan tidak disampaikan tepat waktu kepada Kementerian LHK.', suggestedAssertions: ['Completeness', 'Cut-off'] },

  // --- Other BUMN Clusters (Lampiran 2) ---
  { id: 'risk-umum-01', cluster: 'Umum', riskDescription: 'Struktur keuangan yang kompleks dengan transaksi antar BUMN meningkatkan risiko kesalahan konsolidasi.', suggestedAssertions: ['Completeness', 'Accuracy'] },
  { id: 'risk-energi-01', cluster: 'Industri Energi', riskDescription: 'Ketidakakuratan estimasi cadangan minyak dan gas yang memerlukan penilaian signifikan.', suggestedAssertions: ['Valuation', 'Accuracy'] },
  { id: 'risk-pangan-01', cluster: 'Industri Pangan dan Pupuk', riskDescription: 'Kompleksitas kontrak dengan distributor/pengecer menyebabkan kesalahan pengakuan pendapatan.', suggestedAssertions: ['Occurrence', 'Cut-off'] },
  { id: 'risk-keuangan-01', cluster: 'Jasa Keuangan', riskDescription: 'Kesalahan penilaian aset keuangan atau instrumen derivatif yang kompleks.', suggestedAssertions: ['Valuation'] },
  { id: 'risk-telkom-01', cluster: 'Jasa Telekomunikasi dan Media', riskDescription: 'Kesalahan pengakuan pendapatan dari kontrak layanan bundling yang kompleks.', suggestedAssertions: ['Occurrence', 'Accuracy'] },
  { id: 'risk-infrastruktur-01', cluster: 'Jasa Infrastruktur', riskDescription: 'Kesalahan perhitungan persentase penyelesaian (percentage of completion) pada proyek jangka panjang.', suggestedAssertions: ['Accuracy', 'Cut-off'] },
  { id: 'risk-asuransi-01', cluster: 'Jasa Asuransi dan Dana Pensiun', riskDescription: 'Estimasi cadangan klaim (IBNR) yang tidak memadai akibat asumsi aktuarial yang tidak tepat.', suggestedAssertions: ['Valuation', 'Completeness'] },
  { id: 'risk-pariwisata-01', cluster: 'Jasa Pariwisata dan Pendukung', riskDescription: 'Kesalahan pencatatan pendapatan yang dipengaruhi oleh pengaturan pembatalan/refund kontrak layanan pariwisata.', suggestedAssertions: ['Accuracy', 'Occurrence'] },
  { id: 'risk-perkebunan-01', cluster: 'Industri Perkebunan dan Kehutanan', riskDescription: 'Kesalahan dalam penilaian aset biologis dan tanaman menghasilkan (bearer plants).', suggestedAssertions: ['Valuation'] },
  { id: 'risk-logistik-01', cluster: 'Jasa Logistik', riskDescription: 'Kesalahan akuntansi sewa (PSAK 73/IFRS 16) untuk armada transportasi dan fasilitas gudang.', suggestedAssertions: ['Completeness', 'Valuation'] },
];
