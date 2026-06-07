import { AIUseCaseDrilldown } from './types';

export const AI_BANKING_DRILLDOWN_DATA: Record<string, AIUseCaseDrilldown> = {
  "aml-detection": {
    id: "aml-detection",
    metrics: [
      { label: "Alert Precision", value: "92.5%", trend: "up" },
      { label: "Cases Flagged", value: "48", trend: "down" },
      { label: "Avg Investigation Time", value: "1.4 hrs", trend: "down" }
    ],
    chart: {
      type: 'scatter',
      title: "Transaction Structuring Patterns (Smurfing)",
      data: [
        { x: 9500, y: 12, label: "Customer A" },
        { x: 9800, y: 15, label: "Customer B" },
        { x: 9950, y: 22, label: "High Risk Alert" },
        { x: 9990, y: 35, label: "Critical Alert" },
        { x: 4500, y: 2, label: "Normal" },
        { x: 3200, y: 1, label: "Normal" }
      ]
    },
    findings: [
      { unit: "Account #8821-XX", pattern: "Repeated $9k+ deposits", risk: "Critical", status: "In Investigation" },
      { unit: "Account #1029-XX", pattern: "Rapid cross-border transfers", risk: "High", status: "Flagged" },
      { unit: "Account #5542-XX", pattern: "Suspense account manual override", risk: "Medium", status: "Review" }
    ]
  },
  "credit-portfolio": {
    id: "credit-portfolio",
    metrics: [
      { label: "NPL Ratio", value: "2.14%", trend: "down" },
      { label: "Provision Coverage", value: "145%", trend: "up" },
      { label: "Watchlist Growth", value: "+0.4%", trend: "up" }
    ],
    chart: {
      type: 'radar',
      title: "Loan Portfolio Risk Distribution",
      data: [
        { subject: 'SME', A: 120, B: 110, fullMark: 150 },
        { subject: 'Corporate', A: 98, B: 130, fullMark: 150 },
        { subject: 'Retail', A: 86, B: 130, fullMark: 150 },
        { subject: 'Mortgage', A: 99, B: 100, fullMark: 150 },
        { subject: 'Micro', A: 85, B: 90, fullMark: 150 }
      ]
    },
    findings: [
      { unit: "Cluster: SME (Textile)", forecast: "Potential NPL Spike", impact: "High", mitigation: "Reschedule" },
      { unit: "Cluster: Corporate (Mining)", forecast: "Stable", impact: "Medium", mitigation: "Maintain" },
      { unit: "Cluster: Retail (Payroll)", forecast: "Improving", impact: "Low", mitigation: "Expand" }
    ]
  },
  "suspense-monitoring": {
    id: "suspense-monitoring",
    metrics: [
      { label: "Unreconciled Items", value: "142", trend: "down" },
      { label: "Oldest Item", value: "12 days", trend: "down" },
      { label: "Manual Corrections", value: "24", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "Suspense Account Aging (By Department)",
      data: [
        { name: 'Treasury', items: 45 },
        { name: 'Trade Fin', items: 32 },
        { name: 'Cards', items: 56 },
        { name: 'Ops', items: 12 }
      ]
    },
    findings: [
      { unit: "Treasury GL-110", item: "FX Settlement Mismatch", aging: "5 days", priority: "High" },
      { unit: "Cards GL-202", item: "ATM Chargeback Pending", aging: "12 days", priority: "Critical" }
    ]
  }
};
