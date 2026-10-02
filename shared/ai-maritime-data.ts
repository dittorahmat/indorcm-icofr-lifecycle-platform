import { AIUseCaseDrilldown } from './types';

export const AI_MARITIME_DRILLDOWN_DATA: Record<string, AIUseCaseDrilldown> = {
  "bunker-anomaly": {
    id: "bunker-anomaly",
    metrics: [
      { label: "Bunker Precision", value: "95.8%", trend: "up" },
      { label: "Flagged Discrepancies", value: "7 Voyages", trend: "down" },
      { label: "Est. Fuel Saved", value: "142 KL", trend: "up" }
    ],
    chart: {
      type: 'scatter',
      title: "Specific Fuel Oil Consumption (SFOC) vs Speed (Knots)",
      data: [
        { speed: 12, consumption: 210, label: "KM Kelud (Normal)" },
        { speed: 14, consumption: 245, label: "KM Dorolonda (Normal)" },
        { speed: 15, consumption: 260, label: "KM Labobar (Normal)" },
        { speed: 11, consumption: 310, label: "KM Sinabung (Anomaly Alert)" },
        { speed: 13, consumption: 340, label: "KM Bukit Siguntang (Critical SFOC)" },
        { speed: 16, consumption: 290, label: "KM Lambelu (Optimal)" },
        { speed: 10, consumption: 190, label: "KM Ciremai (Normal)" }
      ]
    },
    findings: [
      { vessel: "KM Sinabung", voyage: "VY-2026-081", port: "Makassar", variance: "+18.4% SFOC", risk: "Critical", status: "Inspection Required" },
      { vessel: "KM Bukit Siguntang", voyage: "VY-2026-094", port: "Balikpapan", variance: "+14.2% SFOC", risk: "High", status: "Flagged" },
      { vessel: "KM Dobonsolo", voyage: "VY-2026-077", port: "Surabaya", variance: "+7.5% SFOC", risk: "Medium", status: "Under Review" }
    ]
  },
  "predictive-docking": {
    id: "predictive-docking",
    metrics: [
      { label: "Docking Cost Accuracy", value: "92.4%", trend: "up" },
      { label: "Active Overrun Risk", value: "2 Vessels", trend: "down" },
      { label: "Spare Part Delivery Lead", value: "14 Days", trend: "down" }
    ],
    chart: {
      type: 'radar',
      title: "Shipyard Performance & Cost Variance Evaluation",
      data: [
        { subject: 'Cost Adherence', A: 85, B: 90, fullMark: 100 },
        { subject: 'Schedule Precision', A: 78, B: 85, fullMark: 100 },
        { subject: 'OEM Spare Parts', A: 92, B: 88, fullMark: 100 },
        { subject: 'Workmanship Quality', A: 88, B: 92, fullMark: 100 },
        { subject: 'Warranty Settlement', A: 80, B: 85, fullMark: 100 }
      ]
    },
    findings: [
      { vessel: "KM Bukit Siguntang", shipyard: "PT Dok & Perkapalan Surabaya", rab_variance: "+12.8% (Rp 640M)", issue: "Auxiliary Engine Overhaul", risk: "High" },
      { vessel: "KM Umsini", shipyard: "PT Kodja Bahari", rab_variance: "+8.5% (Rp 310M)", issue: "Hull Blasting & Coating Delay", risk: "Medium" },
      { vessel: "KM Pangrango", shipyard: "PT IKI Makassar", rab_variance: "-2.1% (Within RAB)", issue: "Routine Annual Survey", risk: "Low" }
    ]
  },
  "pso-ticket-recon": {
    id: "pso-ticket-recon",
    metrics: [
      { label: "Reconciliation Rate", value: "99.1%", trend: "up" },
      { label: "Unmatched Embarkations", value: "28 Items", trend: "down" },
      { label: "Potential PSO Leakage", value: "Rp 0", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "Unreconciled PSO Passenger Manifest by Sea Route (Trayek)",
      data: [
        { route: 'R-14 Ambon-Saumlaki', unverified: 12 },
        { route: 'R-02 Tanjung Priok-Batam', unverified: 7 },
        { route: 'R-09 Bitung-Ternate', unverified: 5 },
        { route: 'R-21 Surabaya-Kupang', unverified: 4 }
      ]
    },
    findings: [
      { route: "R-14 Ambon-Saumlaki", vessel: "KM Pangrango", manifest_pax: "482", scanned_pax: "470", variance: "12 Pax", risk: "Medium" },
      { route: "R-02 Tanjung Priok-Batam", vessel: "KM Kelud", manifest_pax: "1,850", scanned_pax: "1,843", variance: "7 Pax", risk: "Low" },
      { route: "R-09 Bitung-Ternate", vessel: "KM Sangiang", manifest_pax: "320", scanned_pax: "315", variance: "5 Pax", risk: "Low" }
    ]
  },
  "cargo-leakage": {
    id: "cargo-leakage",
    metrics: [
      { label: "Demurrage Billing Rate", value: "96.5%", trend: "up" },
      { label: "Unsealed Containers", value: "3 Units", trend: "down" },
      { label: "Reefer Slot Utilization", value: "88.2%", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "Cargo Demurrage Recovery & Unbilled Days by Branch",
      data: [
        { branch: 'Cabang Makassar', unbilled_days: 18 },
        { branch: 'Cabang Tanjung Perak', unbilled_days: 14 },
        { branch: 'Cabang Belawan', unbilled_days: 9 },
        { branch: 'Cabang Bitung', unbilled_days: 6 }
      ]
    },
    findings: [
      { container_no: "PELU-882910-1", vessel: "KM Sinabung", port: "Makassar", issue: "Missing e-Manifest Barcode", risk: "Critical", status: "Held at Gate" },
      { container_no: "PELU-440192-8", vessel: "KM Logistik Nusantara 2", port: "Tanjung Perak", issue: "Demurrage Unbilled (14 days)", risk: "High", status: "Billing Pending" },
      { container_no: "REEF-110293-4", vessel: "KM Dobonsolo", port: "Bitung", issue: "Plug-in Power Log Incomplete", risk: "Medium", status: "Verified" }
    ]
  },
  "port-disbursement-nlp": {
    id: "port-disbursement-nlp",
    metrics: [
      { label: "Tariff Validation Score", value: "98.2%", trend: "up" },
      { label: "Agency Invoice Exceptions", value: "9 Notes", trend: "down" },
      { label: "Total Overbilling Blocked", value: "Rp 284M", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "Port Disbursement Tariff Deviations (vs Pelindo Gazette)",
      data: [
        { port: 'Belawan', deviation: 12 },
        { port: 'Tanjung Priok', deviation: 8 },
        { port: 'Makassar', deviation: 5 },
        { port: 'Benoa', deviation: 2 }
      ]
    },
    findings: [
      { invoice_id: "INV-PLD-8891", port: "Belawan", service: "Tugboat & Pilotage", tariff_rule: "SK Dir Pelindo 2025", variance: "+Rp 42.5M", risk: "High" },
      { invoice_id: "INV-AGN-4402", port: "Tanjung Priok", service: "Freshwater Bunkering Surcharge", tariff_rule: "Standard Port Tariff", variance: "+Rp 18.2M", risk: "Medium" },
      { invoice_id: "INV-PLD-3310", port: "Makassar", service: "Berthing Dues (Tambat)", tariff_rule: "SK Dir Pelindo 2025", variance: "+Rp 9.6M", risk: "Low" }
    ]
  },
  "crew-payroll": {
    id: "crew-payroll",
    metrics: [
      { label: "Logbook Match Rate", value: "99.4%", trend: "up" },
      { label: "Per Diem Inconsistencies", value: "4 ABK", trend: "down" },
      { label: "Sailing Day Verification", value: "100%", trend: "up" }
    ],
    chart: {
      type: 'bar',
      title: "Crew Per Diem (Uang Layar) Audited by Fleet Sector",
      data: [
        { fleet: 'Kapal Penumpang', audited: 820 },
        { fleet: 'Tol Laut Barang', audited: 240 },
        { fleet: 'Kapal Perintis', audited: 360 },
        { fleet: 'Kapal Ternak', audited: 85 }
      ]
    },
    findings: [
      { crew_id: "ABK-9921", vessel: "KM Dorolonda", claim: "Per Diem 24 Days", logbook_record: "Sign-off Day 18 (Hospital Leave)", variance: "6 Days Overclaim", risk: "High" },
      { crew_id: "ABK-8812", vessel: "KM Lambelu", claim: "Overtime Mooring", logbook_record: "Standard Anchor Watch", variance: "Overtime Discrepancy", risk: "Medium" }
    ]
  }
};
