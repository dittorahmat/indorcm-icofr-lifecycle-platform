import { AIUseCaseDrilldown } from './types';

export const AI_AVIATION_DRILLDOWN_DATA: Record<string, AIUseCaseDrilldown> = {
  "track-anomaly": {
    id: "track-anomaly",
    metrics: [
      { label: "Track Conformance", value: "97.6%", trend: "up" },
      { label: "Flagged Deviations", value: "5 Flights", trend: "down" },
      { label: "Unidentified Tracks", value: "1 Track", trend: "down" }
    ],
    chart: {
      type: 'scatter',
      title: "Lateral Deviation (NM) vs Ground Speed (Knots)",
      data: [
        { speed: 320, consumption: 0.4, label: "QZ-750 (Normal)" },
        { speed: 350, consumption: 0.6, label: "ID-6780 (Normal)" },
        { speed: 380, consumption: 0.8, label: "JT-610 (Normal)" },
        { speed: 300, consumption: 3.2, label: "IL-221 (Anomaly Alert)" },
        { speed: 340, consumption: 4.1, label: "UNID-07 (Critical Deviation)" },
        { speed: 390, consumption: 0.5, label: "SQ-951 (Optimal)" },
        { speed: 280, consumption: 0.3, label: "GA-410 (Normal)" }
      ]
    },
    findings: [
      { flight: "UNID-07", sector: "WIIF-E3", route: "Off-airway", variance: "+4.1 NM lateral", risk: "Critical", status: "Inspection Required" },
      { flight: "IL-221", sector: "WAAF-N2", route: "W45 deviation", variance: "+3.2 NM lateral", risk: "High", status: "Flagged" },
      { flight: "JT-610", sector: "WIIF-W1", route: "Standard STAR", variance: "+0.8 NM lateral", risk: "Medium", status: "Under Review" }
    ]
  },
  "cns-maintenance": {
    id: "cns-maintenance",
    metrics: [
      { label: "CNS Availability", value: "99.2%", trend: "up" },
      { label: "Active Overrun Risk", value: "2 Stations", trend: "down" },
      { label: "Spare Part Lead Time", value: "21 Days", trend: "down" }
    ],
    chart: {
      type: 'radar',
      title: "CNS Vendor Performance & Cost Variance Evaluation",
      data: [
        { subject: 'Cost Adherence', A: 85, B: 90, fullMark: 100 },
        { subject: 'Schedule Precision', A: 78, B: 85, fullMark: 100 },
        { subject: 'OEM Spare Parts', A: 92, B: 88, fullMark: 100 },
        { subject: 'Workmanship Quality', A: 88, B: 92, fullMark: 100 },
        { subject: 'Warranty Settlement', A: 80, B: 85, fullMark: 100 }
      ]
    },
    findings: [
      { station: "ILS CGK 07R", vendor: "PT Aviasi Elektro", rab_variance: "+12.8% (Rp 640M)", issue: "Localizer Array Overhaul", risk: "High" },
      { station: "Radar Makassar", vendor: "PT Sinar Navigasi", rab_variance: "+8.5% (Rp 310M)", issue: "Radome Replacement Delay", risk: "Medium" },
      { station: "ADS-B Kupang", vendor: "PT Nusa Avionik", rab_variance: "-2.1% (Within RAB)", issue: "Routine Annual Calibration", risk: "Low" }
    ]
  },
  "route-charges-recon": {
    id: "route-charges-recon",
    metrics: [
      { label: "Reconciliation Rate", value: "99.1%", trend: "up" },
      { label: "Unmatched Movements", value: "28 Items", trend: "down" },
      { label: "Potential Revenue Leakage", value: "Rp 0", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "Unreconciled Route Charges by FIR Sector",
      data: [
        { route: 'WIIF Jakarta-East', unverified: 12 },
        { route: 'WIIF Jakarta-West', unverified: 7 },
        { route: 'WAAF Makassar-North', unverified: 5 },
        { route: 'WAAF Makassar-South', unverified: 4 }
      ]
    },
    findings: [
      { route: "WIIF Jakarta-East", flight: "QZ-750", plan_movements: "482", billed_movements: "470", variance: "12 Movements", risk: "Medium" },
      { route: "WIIF Jakarta-West", flight: "ID-6780", plan_movements: "1,850", billed_movements: "1,843", variance: "7 Movements", risk: "Low" },
      { route: "WAAF Makassar-North", flight: "JT-610", plan_movements: "320", billed_movements: "315", variance: "5 Movements", risk: "Low" }
    ]
  },
  "movement-leakage": {
    id: "movement-leakage",
    metrics: [
      { label: "Billing Capture Rate", value: "98.7%", trend: "up" },
      { label: "Unbilled Movements", value: "3 Flights", trend: "down" },
      { label: "Slot Utilization", value: "91.4%", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "Unbilled Movements by Airport",
      data: [
        { branch: 'CGK Soekarno-Hatta', unbilled_days: 18 },
        { branch: 'SUB Juanda', unbilled_days: 14 },
        { branch: 'DPS Ngurah Rai', unbilled_days: 9 },
        { branch: 'UPG Hasanuddin', unbilled_days: 6 }
      ]
    },
    findings: [
      { flight_no: "IL-221", airport: "CGK", fir: "WIIF", issue: "Missing flight plan record", risk: "Critical", status: "Held for Billing" },
      { flight_no: "CN-4402", airport: "SUB", fir: "WIIF", issue: "Movement unbilled (14 days)", risk: "High", status: "Billing Pending" },
      { flight_no: "FD-1102", airport: "DPS", fir: "WAAF", issue: "Slot record incomplete", risk: "Medium", status: "Verified" }
    ]
  },
  "vendor-invoice-nlp": {
    id: "vendor-invoice-nlp",
    metrics: [
      { label: "Contract Validation Score", value: "98.2%", trend: "up" },
      { label: "Invoice Exceptions", value: "9 Notes", trend: "down" },
      { label: "Total Overbilling Blocked", value: "Rp 284M", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "Vendor Invoice Deviations (vs CNS Contract)",
      data: [
        { port: 'Jakarta (Cengkareng)', deviation: 12 },
        { port: 'Surabaya (JATSC)', deviation: 8 },
        { port: 'Makassar (MATSC)', deviation: 5 },
        { port: 'Medan (Branch)', deviation: 2 }
      ]
    },
    findings: [
      { invoice_id: "INV-CNS-8891", station: "Jakarta", service: "ILS Spare Parts", tariff_rule: "Contract CNS 2025", variance: "+Rp 42.5M", risk: "High" },
      { invoice_id: "INV-CNS-4402", station: "Surabaya", service: "Radar Maintenance Surcharge", tariff_rule: "Standard CNS Tariff", variance: "+Rp 18.2M", risk: "Medium" },
      { invoice_id: "INV-CNS-3310", station: "Makassar", service: "ADS-B Calibration", tariff_rule: "Contract CNS 2025", variance: "+Rp 9.6M", risk: "Low" }
    ]
  },
  "atc-roster": {
    id: "atc-roster",
    metrics: [
      { label: "License Match Rate", value: "99.4%", trend: "up" },
      { label: "Allowance Inconsistencies", value: "4 Personnel", trend: "down" },
      { label: "Roster Verification", value: "100%", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "ATC Allowance Audited by Unit",
      data: [
        { fleet: 'JATSC Jakarta', audited: 820 },
        { fleet: 'MATSC Makassar', audited: 240 },
        { fleet: 'Branch Medan', audited: 360 },
        { fleet: 'Branch Balikpapan', audited: 85 }
      ]
    },
    findings: [
      { crew_id: "ATC-9921", unit: "JATSC Approach", claim: "Allowance 24 Shifts", logbook_record: "Roster 18 Shifts (Training Leave)", variance: "6 Shifts Overclaim", risk: "High" },
      { crew_id: "ATC-8812", unit: "MATSC Tower", claim: "Overtime Night Shift", logbook_record: "Standard Day Shift", variance: "Shift Discrepancy", risk: "Medium" }
    ]
  }
};
