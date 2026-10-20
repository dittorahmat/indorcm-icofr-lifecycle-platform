import { AIUseCaseDrilldown } from './types';

export interface PeruriProductionTrend {
  name: string;
  volume: number; // Million bilyet/pieces
  billed: number; // IDR Billions
}

export interface PeruriQualityBenchmark {
  cluster: string;
  rate: number; // Quality pass rate %
}

export interface PeruriCcmAlert {
  time: string;
  type: 'ALERT' | 'LOG';
  msg: string;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
}

export const PERURI_PRODUCTION_TRENDS: PeruriProductionTrend[] = [
  { name: 'Jan', volume: 642, billed: 410 },
  { name: 'Feb', volume: 618, billed: 395 },
  { name: 'Mar', volume: 685, billed: 442 },
  { name: 'Apr', volume: 660, billed: 428 },
  { name: 'May', volume: 720, billed: 468 },
  { name: 'Jun', volume: 705, billed: 455 },
];

export const PERURI_QUALITY_BENCHMARKS: PeruriQualityBenchmark[] = [
  { cluster: 'Uang Kertas (Intaglio)', rate: 99.4 },
  { cluster: 'Uang Logam (Koin)', rate: 99.8 },
  { cluster: 'Pita Cukai & Paspor', rate: 99.6 },
  { cluster: 'GovTech e-Meterai', rate: 99.9 },
];

export const PERURI_CCM_ALERTS: PeruriCcmAlert[] = [
  {
    time: '10:42 AM',
    type: 'ALERT',
    msg: 'Khazanah Bahan Baku: Dual-biometric vault access recorded off-shift at Karawang Facility - Verified against emergency SPK escort protocol.',
    severity: 'HIGH',
  },
  {
    time: '10:15 AM',
    type: 'ALERT',
    msg: 'Security Thread Anomaly: Substrate spool lot mismatch flagged on Intaglio Press #04 prior to print execution - Feeder interlocked & halted.',
    severity: 'HIGH',
  },
  {
    time: '09:30 AM',
    type: 'LOG',
    msg: 'Pita Cukai Serialization: 10,000 security sheets Lot 8820 validated with Ditjen Bea Cukai national gateway with zero serial gap.',
    severity: 'INFO',
  },
  {
    time: '08:45 AM',
    type: 'ALERT',
    msg: 'e-Meterai HSM Root Cert: PSrE digital signing certificate scheduled to rotate in 14 days - Key Ceremony ceremonial ceremony scheduled.',
    severity: 'MEDIUM',
  },
  {
    time: 'Yesterday',
    type: 'ALERT',
    msg: 'Intaglio Reject Spike: Press #02 defect rate reached 1.12% exceeding 0.85% SK-5 tolerance on Rp 50.000 TE 2022 - Auto-paused for plate calibration.',
    severity: 'HIGH',
  },
  {
    time: 'Yesterday',
    type: 'LOG',
    msg: 'E-Passport Assembly: Contactless chip antenna resonance test passed for 1,200 passport booklets (Pass rate: 100%).',
    severity: 'INFO',
  },
  {
    time: '2 days ago',
    type: 'LOG',
    msg: 'Bank Indonesia Khazanah Handover: 450M bilyet Rp 100.000 TE 2022 cleared with physical count matching digital vault manifesto.',
    severity: 'INFO',
  },
];

export const AI_PERURI_DRILLDOWN_DATA: Record<string, AIUseCaseDrilldown> = {
  'banknote-vision-defect': {
    id: 'banknote-vision-defect',
    metrics: [
      { label: 'Vision Inspection Accuracy', value: '99.84%', trend: 'up' },
      { label: 'Defective Sheets Flagged', value: '14 Bilyet', trend: 'down' },
      { label: 'False Positive Rate', value: '0.04%', trend: 'down' },
    ],
    chart: {
      type: 'scatter',
      title: 'Press Speed (m/min) vs Defect Area (mm²)',
      data: [
        { speed: 280, defect_area: 0.12, consumption: 0.12, label: 'Batch A-1 (Normal)' },
        { speed: 310, defect_area: 0.18, consumption: 0.18, label: 'Batch A-2 (Normal)' },
        { speed: 340, defect_area: 0.22, consumption: 0.22, label: 'Batch A-3 (Normal)' },
        { speed: 350, defect_area: 0.85, consumption: 0.85, label: 'Batch B-1 (Intaglio Flaw)' },
        { speed: 290, defect_area: 1.45, consumption: 1.45, label: 'Batch C-3 (Critical Thread Defect)' },
        { speed: 320, defect_area: 0.15, consumption: 0.15, label: 'Batch D-1 (Optimal)' },
        { speed: 300, defect_area: 0.14, consumption: 0.14, label: 'Batch D-2 (Normal)' },
      ],
    },
    findings: [
      {
        batch_id: 'BN-2026-100K-08',
        press_line: 'KBA-NotaSys #4',
        denomination: 'Rp 100.000 TE 2022',
        defect_type: 'Intaglio Misregistration (0.35mm)',
        risk: 'Critical',
        status: 'Quarantined',
      },
      {
        batch_id: 'BN-2026-050K-12',
        press_line: 'Super Simultan #2',
        denomination: 'Rp 50.000 TE 2022',
        defect_type: 'UV Thread Micro-gap',
        risk: 'High',
        status: 'Inspection Required',
      },
      {
        batch_id: 'BN-2026-020K-03',
        press_line: 'KBA-NotaSys #1',
        denomination: 'Rp 20.000 TE 2022',
        defect_type: 'Watermark Opacity Variance',
        risk: 'Medium',
        status: 'Under Review',
      },
    ],
  },
  'raw-material-press-maintenance': {
    id: 'raw-material-press-maintenance',
    metrics: [
      { label: 'Press Fleet Availability', value: '98.9%', trend: 'up' },
      { label: 'Predictive Overrun Alert', value: '2 Presses', trend: 'down' },
      { label: 'Security Ink Viscosity Index', value: '99.2%', trend: 'up' },
    ],
    chart: {
      type: 'radar',
      title: 'Printing Press & Substrate Health Evaluation',
      data: [
        { subject: 'Cylinder Pressure', A: 92, B: 95, fullMark: 100 },
        { subject: 'Ink Viscosity', A: 84, B: 90, fullMark: 100 },
        { subject: 'Blanket Tension', A: 89, B: 90, fullMark: 100 },
        { subject: 'Bearing Health', A: 76, B: 85, fullMark: 100 },
        { subject: 'Thermal Profile', A: 94, B: 92, fullMark: 100 },
      ],
    },
    findings: [
      {
        equipment: 'Intaglio Press KBA #03',
        component: 'Plate Cylinder Bearing',
        variance: '+14.2% Vibration',
        issue: 'Hydraulic Seal Degradation',
        risk: 'High',
      },
      {
        equipment: 'Super Simultan Press #02',
        component: 'OVI Ink Fountain Roller',
        variance: '+8.7% Viscosity Drift',
        issue: 'Thermal Regulation Lag',
        risk: 'Medium',
      },
      {
        equipment: 'Coin Blank Stamper #01',
        component: 'Coining Die 1000',
        variance: '-1.5% Striking Force',
        issue: 'Normal Die Wear',
        risk: 'Low',
      },
    ],
  },
  'bi-order-delivery-recon': {
    id: 'bi-order-delivery-recon',
    metrics: [
      { label: 'SPK Reconciliation Rate', value: '99.4%', trend: 'up' },
      { label: 'Unreconciled Batches', value: '14 Batches', trend: 'down' },
      { label: 'Vault Deposit Clearance', value: '100%', trend: 'up' },
    ],
    chart: {
      type: 'bar',
      title: 'Reconciled Print Yield by Denomination (Million Bilyet)',
      data: [
        { denomination: 'Rp 100.000', yield: 450 },
        { denomination: 'Rp 50.000', yield: 320 },
        { denomination: 'Rp 20.000', yield: 180 },
        { denomination: 'Rp 10.000', yield: 140 },
        { denomination: 'Koin 1000', yield: 85 },
      ],
    },
    findings: [
      {
        spk_no: 'SPK-BI/2026/041',
        denomination: 'Rp 100.000',
        order_volume: '450M Bilyet',
        print_yield: '449.6M Bilyet',
        variance: '0.09% (Within SLA)',
        risk: 'Low',
      },
      {
        spk_no: 'SPK-BI/2026/042',
        denomination: 'Rp 50.000',
        order_volume: '320M Bilyet',
        print_yield: '318.9M Bilyet',
        variance: '0.34% (Audit Flag)',
        risk: 'Medium',
      },
      {
        spk_no: 'SPK-BI/2026/045',
        denomination: 'Rp 10.000',
        order_volume: '180M Bilyet',
        print_yield: '179.8M Bilyet',
        variance: '0.11% (Within SLA)',
        risk: 'Low',
      },
    ],
  },
  'excise-passport-leakage': {
    id: 'excise-passport-leakage',
    metrics: [
      { label: 'Serial Integrity Rate', value: '99.99%', trend: 'up' },
      { label: 'Discrepancy Alerts', value: '0 Serial', trend: 'down' },
      { label: 'Spoilage Destruction Audit', value: '100%', trend: 'up' },
    ],
    chart: {
      type: 'bar',
      title: 'Audited Security Document Volume (Thousand Sheets/Units)',
      data: [
        { category: 'Pita Cukai HT', audited: 850 },
        { category: 'Pita Cukai MMEA', audited: 420 },
        { category: 'Paspor Elektronik', audited: 310 },
        { category: 'Meterai Fisik', audited: 190 },
      ],
    },
    findings: [
      {
        doc_series: 'PC-HT-2026-SERI3',
        category: 'Pita Cukai HT',
        target_batch: 'Lot 8820A-8840A',
        missing_range: '0 Sheets',
        audit_status: 'Verified Reconciled',
        risk: 'Low',
      },
      {
        doc_series: 'PAS-RI-2026-EPAS',
        category: 'E-Passport Polycarbonate',
        target_batch: 'Chip Batch CP-1104',
        missing_range: '2 Chip Mismatches',
        audit_status: 'Held for Inspection',
        risk: 'High',
      },
      {
        doc_series: 'PC-MMEA-2026-GOLC',
        category: 'Pita Cukai MMEA',
        target_batch: 'Lot 3102-3108',
        missing_range: '1 Plate Blank Offset',
        audit_status: 'Under Audit',
        risk: 'Medium',
      },
    ],
  },
  'raw-material-procurement-nlp': {
    id: 'raw-material-procurement-nlp',
    metrics: [
      { label: 'Contract Matching Score', value: '98.7%', trend: 'up' },
      { label: 'Purchase Deviations Flagged', value: '6 POs', trend: 'down' },
      { label: 'Cost Overruns Prevented', value: 'Rp 1.42B', trend: 'up' },
    ],
    chart: {
      type: 'bar',
      title: 'Vendor Price & Delivery Deviations by Material Category',
      data: [
        { category: 'Kertas Uang & Paspor', deviation: 14 },
        { category: 'Tinta Cetak Sekuriti', deviation: 9 },
        { category: 'Foil Holografik', deviation: 6 },
        { category: 'Chip & Inlay e-Paspor', deviation: 3 },
      ],
    },
    findings: [
      {
        po_number: 'PO-RAW-2026-081',
        vendor: 'PT Kertas Padalarang',
        material: 'Cotton Security Substrate',
        contract_rule: 'SK-BahanBaku-2026',
        variance: '+Rp 128.5M (Tariff drift)',
        risk: 'High',
      },
      {
        po_number: 'PO-RAW-2026-044',
        vendor: 'Sicpa SA / Peruri Ink',
        material: 'OVI / Spark Ink Green-to-Blue',
        contract_rule: 'Exclusive Master Agreement',
        variance: 'Within Contract Pricing',
        risk: 'Low',
      },
      {
        po_number: 'PO-RAW-2026-092',
        vendor: 'PT Foil Sekuriti Indah',
        material: 'Holographic Stripe Foil',
        contract_rule: 'SK-BahanBaku-2026',
        variance: '+Rp 34.2M (Volume tier)',
        risk: 'Medium',
      },
    ],
  },
  'govtech-digital-sla': {
    id: 'govtech-digital-sla',
    metrics: [
      { label: 'e-Meterai Stamping SLA', value: '99.85%', trend: 'up' },
      { label: 'P95 Stamping Latency', value: '185ms', trend: 'down' },
      { label: 'Digital Cert Anomalies', value: '0 Revoked', trend: 'up' },
    ],
    chart: {
      type: 'line',
      title: 'e-Meterai Stamping Hourly Latency Profile (Milliseconds)',
      data: [
        { time: '08:00', latency: 142 },
        { time: '10:00', latency: 155 },
        { time: '12:00', latency: 210 },
        { time: '14:00', latency: 185 },
        { time: '16:00', latency: 168 },
        { time: '18:00', latency: 135 },
      ],
    },
    findings: [
      {
        service_channel: 'e-Meterai Enterprise API',
        partner_client: 'Bank Mandiri / BRI',
        metric: 'Average Latency 142ms',
        anomaly: 'Normal Stamping Traffic',
        risk: 'Low',
      },
      {
        service_channel: 'Peruri Sign PSrE Hub',
        partner_client: 'Kemenkeu DJP Portal',
        metric: 'PKI Handshake Delay (620ms)',
        anomaly: 'HSM Peak Load Warning',
        risk: 'Medium',
      },
      {
        service_channel: 'INA Digital ID Gateway',
        partner_client: 'GovTech National Portal',
        metric: 'Auth Handshake 110ms',
        anomaly: 'Zero Anomaly (All Pass)',
        risk: 'Low',
      },
    ],
  },
};
