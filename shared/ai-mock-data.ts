import { AIUseCaseDrilldown } from './types';

export const AI_DRILLDOWN_DATA: Record<string, AIUseCaseDrilldown> = {
  "fraud-detection": {
    id: "fraud-detection",
    metrics: [
      { label: "Accuracy", value: "94.2%", trend: "up" },
      { label: "Flagged", value: "12", trend: "up" },
      { label: "Status", value: "LIVE" }
    ],
    chart: {
      type: "bar",
      title: "Risk Score by Vendor",
      data: [
        { vendor: "CV MAKMUR JAYA", score: 88, status: "Critical" },
        { vendor: "PT BARU SUKSES", score: 65, status: "High" },
        { vendor: "PT ALAT BERAT", score: 42, status: "Medium" },
        { vendor: "CV AMANAH", score: 12, status: "Low" }
      ]
    },
    findings: [
      { id: "CL-9921", date: "2026-03-28", risk: "High", reason: "Duplicate Invoice Pattern" },
      { id: "CL-9925", date: "2026-03-29", risk: "Critical", reason: "Unregistered Vendor Payment" },
      { id: "CL-9930", date: "2026-03-30", risk: "Medium", reason: "Split PO Threshold" }
    ]
  },
  "anomaly-journal": {
    id: "anomaly-journal",
    metrics: [
      { label: "Confidence", value: "91.5%", trend: "up" },
      { label: "Anomalies", value: "14", trend: "down" },
      { label: "Status", value: "LIVE" }
    ],
    chart: {
      type: "scatter",
      title: "Journal Value vs Time of Day",
      data: [
        { time: 8, value: 500, type: "Normal" },
        { time: 10, value: 1200, type: "Normal" },
        { time: 14, value: 800, type: "Normal" },
        { time: 23, value: 4500, type: "Anomaly" },
        { time: 2, value: 3000, type: "Anomaly" },
        { time: 11, value: 1500, type: "Normal" }
      ]
    },
    findings: [
      { entry: "JV-8821", account: "Cash at Bank", value: "Rp 4.5B", reason: "Off-hours Entry" },
      { entry: "JV-8845", account: "Other Expenses", value: "Rp 120M", reason: "Round Number Pattern" }
    ]
  },
  "predictive-control": {
    id: "predictive-control",
    metrics: [
      { label: "Prob. Fail", value: "15%", trend: "down" },
      { label: "Controls", value: "240", trend: "up" },
      { label: "Status", value: "BETA" }
    ],
    chart: {
      type: "line",
      title: "Control Failure Probability Trend (30d)",
      data: [
        { day: "1", prob: 12 },
        { day: "10", prob: 18 },
        { day: "20", prob: 14 },
        { day: "30", prob: 15 }
      ]
    },
    findings: [
      { control: "LOG-01", name: "Weighbridge Calibration", risk: "High", est_fail: "4 days" },
      { control: "FIN-01", name: "Credit Approval", risk: "Medium", est_fail: "12 days" }
    ]
  },
  "nlp-contracts": {
    id: "nlp-contracts",
    metrics: [
      { label: "Processed", value: "42", trend: "up" },
      { label: "High Risk", value: "5", trend: "down" },
      { label: "Status", value: "LIVE" }
    ],
    chart: {
      type: "bar",
      title: "Risk Clause Frequency",
      data: [
        { clause: "Penalty", count: 8 },
        { clause: "Escalation", count: 12 },
        { clause: "Force Majeure", count: 4 },
        { clause: "Termination", count: 6 }
      ]
    },
    findings: [
      { contract: "PKP2B-2024-001", vendor: "PT TAMBANG JAYA", risk: "High", missing: "Environmental Liability" },
      { contract: "PO-SERV-882", vendor: "CV LOGISTIK", risk: "Medium", missing: "Fixed Price Lock" }
    ]
  },
  "vendor-risk": {
    id: "vendor-risk",
    metrics: [
      { label: "Avg Score", value: "78", trend: "up" },
      { label: "Critical", value: "3", trend: "down" },
      { label: "Status", value: "BETA" }
    ],
    chart: {
      type: "radar",
      title: "Vendor Performance: CV MAKMUR JAYA",
      data: [
        { subject: 'Safety', A: 45, B: 100 },
        { subject: 'Compliance', A: 90, B: 100 },
        { subject: 'Cost', A: 65, B: 100 },
        { subject: 'Performance', A: 50, B: 100 },
        { subject: 'Quality', A: 85, B: 100 },
      ]
    },
    findings: [
      { vendor: "CV MAKMUR JAYA", safety: "Fail", compliance: "Pass", final: "High Risk" },
      { vendor: "PT ALAT BERAT", safety: "Pass", compliance: "Pass", final: "Low Risk" }
    ]
  },
  "predictive-maintenance": {
    id: "predictive-maintenance",
    metrics: [
      { label: "Est. Fail", value: "4 units", trend: "up" },
      { label: "Fleet Health", value: "88%", trend: "down" },
      { label: "Status", value: "POC" }
    ],
    chart: {
      type: "scatter",
      title: "Maint. Cost vs Operation Hours",
      data: [
        { hours: 1000, cost: 50, type: "Healthy" },
        { hours: 5000, cost: 250, type: "Healthy" },
        { hours: 12000, cost: 800, type: "Money Pit" },
        { hours: 15000, cost: 1200, type: "Money Pit" },
        { hours: 3000, cost: 120, type: "Healthy" }
      ]
    },
    findings: [
      { unit: "DT-101 (Komatsu HD785)", age: "8 years", hours: "15,200", status: "Critical" },
      { unit: "EX-202 (CAT 6040)", age: "3 years", hours: "6,400", status: "Good" }
    ]
  }
};
