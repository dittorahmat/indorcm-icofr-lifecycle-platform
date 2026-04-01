## ADDED Requirements

### Requirement: Coal Mining Mock Data - GL Accounts

Sistem SHALL provide 50-60 GL accounts specific untuk coal mining industry.

**Chart of Accounts Structure:**
```
Assets (1xxxxx)
├── Current Assets
│   ├── Cash & Bank
│   ├── Accounts Receivable - Coal Export
│   ├── Accounts Receivable - Domestic (PLN)
│   ├── Coal Stockpile - ROM
│   ├── Coal Stockpile - Cleaned
│   └── Spare Parts Inventory
├── Non-Current Assets
│   ├── Mining Equipment & Machinery
│   ├── Mine Development Costs (WIP)
│   ├── Land & Land Rights
│   └── Reclamation Deposit

Liabilities (2xxxxx)
├── Current Liabilities
│   ├── Accounts Payable - Contractors
│   ├── Royalty Payable
│   ├── Income Tax Payable
│   └── Accrued Expenses
├── Non-Current Liabilities
│   ├── Reclamation Provision (ARO)
│   └── Long-term Debt

Equity (3xxxxx)
├── Share Capital
└── Retained Earnings

Revenue (601xxxx)
├── Revenue - Coal Export
├── Revenue - Coal Domestic
└── Other Income

Cost of Sales (602xxxx)
├── Mining Operations - Direct Costs
├── Overburden Removal Costs
├── Depreciation & Amortization
├── Reclamation Expense
└── Royalty & Taxes

Expenses (603xxxx)
├── General & Administrative
├── Selling Expenses
└── Finance Costs
```

#### Scenario: GL data loaded
- **WHEN** application starts
- **THEN** sistem load 50-60 GL accounts dengan realistic balances

#### Scenario: Balance classification
- **WHEN** GL accounts displayed
- **THEN** accounts grouped by type (Asset, Liability, Equity, P&L)

### Requirement: Coal Mining Mock Data - RCM

Sistem SHALL provide 8 RCMs covering core coal mining business processes.

**RCM List:**
1. Coal Sales Contract Approval (Revenue)
2. Weighbridge & Quality Measurement (Revenue)
3. Revenue Recognition - HBA Pricing (Revenue)
4. Coal Extraction (Production)
5. Stockpile Management (Inventory)
6. Mining Contractor Services (Procurement)
7. Mine Development Capitalization (Fixed Assets)
8. ARO Provision Calculation (Reclamation)

#### Scenario: RCM loaded
- **WHEN** user navigates to RCM page
- **THEN** sistem display 8 RCMs dengan BPM diagrams

#### Scenario: BPM diagram rendered
- **WHEN** user opens RCM detail
- **THEN** sistem display BPM workflow dengan 8-10 nodes

### Requirement: Coal Mining Mock Data - Controls

Sistem SHALL provide 25-30 controls covering all control types.

**Control Mix:**
- Automated: 8-10 controls (weighbridge, SAP, SCADA)
- Manual: 10-12 controls (approvals, reconciliations)
- MRC: 4-5 controls (stockpile survey, ARO calculation)
- ITGC: 3-4 controls (SAP access, system changes)

**Control Assertions Coverage:**
- Completeness: 6-8 controls
- Accuracy: 8-10 controls
- Validity: 5-6 controls
- Existence: 4-5 controls
- Cut-off: 2-3 controls

#### Scenario: Controls loaded
- **WHEN** user views RCM detail
- **THEN** sistem display 3-4 controls per RCM

#### Scenario: Control types displayed
- **WHEN** control detail shown
- **THEN** sistem show control type, frequency, nature icons

### Requirement: Coal Mining Mock Data - Deficiencies

Sistem SHALL provide 5-8 deficiency scenarios realistic untuk coal mining.

**Deficiency Scenarios:**
1. Weighbridge calibration expired (measurement error)
2. Revenue recognition timing (cut-off issue)
3. Stockpile survey variance (volume discrepancy)
4. ARO provision understated (valuation issue)
5. Contractor invoice without approval (validity issue)
6. Royalty calculation error (compliance issue)
7. Capex vs opex misclassification (accounting issue)

#### Scenario: Deficiencies loaded
- **WHEN** user navigates to Deficiencies page
- **THEN** sistem display 5-8 deficiencies dengan severity mix

#### Scenario: Deficiency severity distribution
- **WHEN** deficiencies displayed
- **THEN** mix of Control Deficiency (2-3), Significant Deficiency (2-3), Material Weakness (1-2)

### Requirement: Coal Mining Mock Data - Risk Library

Sistem SHALL provide 15-20 risks specific untuk Industri Mineral dan Batubara.

**Risk Categories (per SK-5 Lampiran 2):**
- Reserve estimation risks (2-3)
- Production measurement risks (2-3)
- Revenue recognition risks (3-4)
- Cost classification risks (2-3)
- Reclamation provision risks (2-3)
- Royalty & tax compliance risks (2-3)
- Environmental compliance risks (2-3)

#### Scenario: Risk library loaded
- **WHEN** user creates new RCM
- **THEN** sistem suggest risks dari Risk Library

#### Scenario: Industry-specific risks
- **WHEN** user selects "Industri Mineral dan Batubara" cluster
- **THEN** sistem show 15-20 coal mining specific risks
