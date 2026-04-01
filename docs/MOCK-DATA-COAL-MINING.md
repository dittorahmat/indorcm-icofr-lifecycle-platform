# Mock Data Documentation - PT Batubara Nusantara Sejahtera

## Entity Profile

**Company Name:** PT Batubara Nusantara Sejahtera  
**Industry:** Coal Mining (Industri Mineral dan Batubara)  
**Location:** Kalimantan Timur  
**Type:** Open-pit coal mining  
**Capacity:** 5 million MT/year  
**Sales Mix:** 70% Export, 30% Domestic (PLN)  
**Pricing:** HBA (Harga Batubara Acuan)

---

## Business Processes (8 RCMs)

### 1. Coal Sales Contract Approval (Revenue & Receivables)
**Process Owner:** Sales Manager  
**Key Risks:** Credit risk, contract terms unfavorable  
**Key Controls:**
- FIN-01: Credit Limit Approval
- LEGAL-01: Sales Contract Legal Review

**BPM Flow:**
```
Sales Order → Credit Check → Credit Approval → 
Prepare Contract → Legal Review → Contract Approval → END
```

---

### 2. Weighbridge & Quality Measurement (Revenue & Receivables)
**Process Owner:** Logistics Manager  
**Key Risks:** Volume measurement error, quality dispute  
**Key Controls:**
- LOG-01: Weighbridge Calibration (Monthly)
- QC-01: Quality Certificate Approval
- LOG-02: Weighbridge Reconciliation (Daily)

**BPM Flow:**
```
Truck Arrives → Gross Weight → Calibration Check → 
Take Sample → Lab Analysis (GAR/TM/Ash) → 
Certificate Approval → Issue Weight Ticket → END
```

---

### 3. Revenue Recognition - HBA Pricing (Revenue & Receivables)
**Process Owner:** Finance Manager  
**Key Risks:** Pricing error, cut-off error  
**Key Controls:**
- BILL-01: HBA Price Verification (ESDM)
- ACC-01: Revenue Recognition Review

**BPM Flow:**
```
Shipment Completed → Get HBA Price → Calculate Quality Adjustment → 
Price Verification → Issue Invoice → Revenue Recognition → 
Revenue Review → END
```

---

### 4. Coal Extraction (Production & Inventory)
**Process Owner:** Mining Manager  
**Key Risks:** Production volume error, equipment downtime  
**Key Controls:**
- PROD-01: Daily Production Report
- SCADA-01: Production Monitoring System

**BPM Flow:**
```
Mine Plan Approved → Overburden Removal → Coal Extraction → 
Daily Production Report → Stockpile Recording → END
```

---

### 5. Stockpile Management (Production & Inventory)
**Process Owner:** Warehouse/Logistics Manager  
**Key Risks:** Stockpile variance, volume discrepancy  
**Key Controls:**
- LOG-03: Monthly Stockpile Survey (Drone)
- ACC-03: Stockpile Variance Analysis

**BPM Flow:**
```
ROM Delivered → Stockpile Recording → Monthly Drone Survey → 
Variance Analysis → Adjustment (if needed) → END
```

---

### 6. Mining Contractor Services (Procure to Pay)
**Process Owner:** Procurement Manager  
**Key Risks:** Work not performed, invoice overbilling  
**Key Controls:**
- PROC-01: Contractor Pre-qualification
- ENG-01: Work Completion Certificate
- PROC-02: Three-Way Match (PO, Certificate, GR)

**BPM Flow:**
```
Service Request → Contractor Selection → Service Execution → 
Work Verification → Certificate Issue → Invoice Approval → 
Payment Processing → END
```

---

### 7. Mine Development Capitalization (Fixed Assets & Capex)
**Process Owner:** Finance Manager  
**Key Risks:** Capex vs opex misclassification  
**Key Controls:**
- MGMT-01: Capex Budget Approval (Board)
- ACC-02: Capitalization Criteria Review (PSAK compliance)

**BPM Flow:**
```
Project Proposal → Capex Budget Approval → Construction → 
Capitalization Review → Criteria Check → Asset Registration → 
Depreciation → END
```

---

### 8. ARO Provision Calculation (Reclamation & Environmental)
**Process Owner:** Environmental Manager  
**Key Risks:** ARO understated, methodology error  
**Key Controls:**
- TECH-01: ARO Methodology Approval (Third-party)
- ENV-01: ARO Provision Review (Annual)

**BPM Flow:**
```
Mine Plan Review → ARO Calculation → Third-party Verification → 
Methodology Review → Provision Booking → Annual Review → END
```

---

## GL Account Dictionary

### Assets (1xxxxx)

#### Current Assets (11xxxx)
| Account Code | Account Name | Type | Normal Balance |
|--------------|--------------|------|----------------|
| 11001 | Kas dan Setara Kas | Asset | Debit |
| 11002 | Piutang Usaha - Coal Export | Asset | Debit |
| 11003 | Piutang Usaha - Domestic (PLN) | Asset | Debit |
| 11004 | Persediaan Batubara - ROM | Asset | Debit |
| 11005 | Persediaan Batubara - Cleaned | Asset | Debit |
| 11006 | Spare Parts Inventory | Asset | Debit |

#### Non-Current Assets (12xxxx)
| Account Code | Account Name | Type | Normal Balance |
|--------------|--------------|------|----------------|
| 12001 | Aset Tetap - Mining Equipment | Asset | Debit |
| 12002 | Aset Tetap - Heavy Machinery | Asset | Debit |
| 12003 | Aset Tetap - Buildings | Asset | Debit |
| 12004 | Biaya Pengembangan Tambang (WIP) | Asset | Debit |
| 12005 | Hak Atas Tanah | Asset | Debit |
| 12006 | Deposit Reklamasi | Asset | Debit |

### Liabilities (2xxxxx)

#### Current Liabilities (21xxxx)
| Account Code | Account Name | Type | Normal Balance |
|--------------|--------------|------|----------------|
| 21001 | Hutang Usaha - Kontraktor | Liability | Credit |
| 21002 | Hutang Royalty | Liability | Credit |
| 21003 | Hutang Pajak | Liability | Credit |
| 21004 | Beban Masih Harus Dibayar | Liability | Credit |

#### Non-Current Liabilities (22xxxx)
| Account Code | Account Name | Type | Normal Balance |
|--------------|--------------|------|----------------|
| 22001 | Provisi Reklamasi (ARO) | Liability | Credit |
| 22002 | Hutang Jangka Panjang | Liability | Credit |

### Equity (3xxxxx)
| Account Code | Account Name | Type | Normal Balance |
|--------------|--------------|------|----------------|
| 31001 | Modal Saham | Equity | Credit |
| 31002 | Saldo Laba | Equity | Credit |

### Revenue (601xxxx)
| Account Code | Account Name | Type | Normal Balance |
|--------------|--------------|------|----------------|
| 60101 | Pendapatan - Coal Export | Revenue | Credit |
| 60102 | Pendapatan - Coal Domestic | Revenue | Credit |
| 60103 | Pendapatan Lain-lain | Revenue | Credit |

### Cost of Sales (602xxxx)
| Account Code | Account Name | Type | Normal Balance |
|--------------|--------------|------|----------------|
| 60201 | Biaya Operasi Tambang | COGS | Debit |
| 60202 | Biaya Pengupasan Tanah (Overburden) | COGS | Debit |
| 60203 | Depresiasi dan Amortisasi | COGS | Debit |
| 60204 | Beban Reklamasi | COGS | Debit |
| 60205 | Royalty dan Pajak | COGS | Debit |

### Expenses (603xxxx)
| Account Code | Account Name | Type | Normal Balance |
|--------------|--------------|------|----------------|
| 60301 | Beban Umum dan Administrasi | Expense | Debit |
| 60302 | Beban Penjualan | Expense | Debit |
| 60303 | Beban Keuangan | Expense | Debit |

---

## Control Summary

### Automated Controls (7)
| Code | Name | Frequency | Application |
|------|------|-----------|-------------|
| SCADA-01 | Production Monitoring System | Daily | SCADA |
| PROC-02 | Three-Way Match | Ad-hoc | SAP |
| BILL-01 | HBA Price Verification | Daily | SAP |
| ITGC-01 | SAP User Access Review | Quarterly | SAP |
| ITGC-02 | Weighbridge System Change Control | Ad-hoc | Weighbridge |
| ITGC-03 | SCADA System Backup | Daily | SCADA |
| ITGC-04 | SAP Interface Control | Daily | SAP |

### Manual Controls (12)
| Code | Name | Frequency | Owner |
|------|------|-----------|-------|
| FIN-01 | Credit Limit Approval | Ad-hoc | Finance Manager |
| LEGAL-01 | Sales Contract Legal Review | Ad-hoc | Legal |
| LOG-01 | Weighbridge Calibration | Monthly | Logistics |
| QC-01 | Quality Certificate Approval | Daily | QC Manager |
| LOG-02 | Weighbridge Reconciliation | Daily | Logistics |
| ACC-01 | Revenue Recognition Review | Daily | Accounting |
| PROD-01 | Daily Production Report | Daily | Mining Manager |
| ENG-01 | Work Completion Certificate | Ad-hoc | Engineering |
| MGMT-01 | Capex Budget Approval | Annual | Board |
| ACC-02 | Capitalization Criteria Review | Quarterly | Accounting |
| TECH-01 | ARO Methodology Approval | Annual | Technical |
| ENV-01 | ARO Provision Review | Annual | Management |

### MRC Controls (4)
| Code | Name | Frequency | Expectation |
|------|------|-----------|-------------|
| LOG-03 | Monthly Stockpile Survey | Monthly | Variance < 5% |
| ACC-03 | Stockpile Variance Analysis | Monthly | Investigate if > 5% |
| ENV-02 | ARO Calculation Review | Annual | Third-party verified |

### ITGC Controls (4)
| Code | Name | ITGC Area | Frequency |
|------|------|-----------|-----------|
| ITGC-01 | SAP User Access Review | Access to Program and Data | Quarterly |
| ITGC-02 | Weighbridge System Change Control | Program Changes | Ad-hoc |
| ITGC-03 | SCADA System Backup | Computer Operations | Daily |
| ITGC-04 | SAP Interface Control | Computer Operations | Daily |

---

## Deficiency Scenarios

### 1. Weighbridge Calibration Expired (Significant Deficiency)
**Control:** LOG-01  
**Issue:** Kalibrasi weighbridge expired sejak 2 bulan  
**Impact:** Rp 5B potential revenue impact  
**Status:** Open

### 2. Revenue Cut-off Error (Material Weakness)
**Control:** ACC-01  
**Issue:** Shipment Dec 2024 recorded in Jan 2025  
**Impact:** Rp 12.5B  
**Status:** Open

### 3. Stockpile Variance 8% (Significant Deficiency)
**Control:** LOG-03  
**Issue:** Variance 8% (40,000 MT) not investigated  
**Impact:** Rp 4B inventory impact  
**Status:** In Progress

### 4. ARO Provision Understated (Material Weakness)
**Control:** ENV-02  
**Issue:** ARO not updated for 3 years  
**Impact:** Rp 25B  
**Status:** Open

### 5. Contractor Payment Without Certificate (Significant Deficiency)
**Control:** ENG-01  
**Issue:** Invoice paid without Work Certificate  
**Impact:** Rp 3.2B  
**Status:** Remediated

### 6. Capex vs Opex Error (Significant Deficiency)
**Control:** ACC-02  
**Issue:** Overburden cost Rp 18B capitalized (should be expensed)  
**Impact:** Rp 18B  
**Status:** Open

### 7. SAP Access for Terminated Users (Control Deficiency)
**Control:** ITGC-01  
**Issue:** 5 terminated users still have access  
**Impact:** Indirect  
**Status:** In Progress

---

## Risk Library (22 Risks)

### Reserve Estimation (3)
- risk-coal-01: Coal reserves KCMI/JORC compliance
- risk-coal-02: Volume and quality estimation accuracy
- risk-coal-03: Geological model update documentation

### Production Measurement (3)
- risk-coal-04: Weighbridge and stockpile survey accuracy
- risk-coal-05: Drone survey vs system records variance
- risk-coal-06: Moisture content determination error

### Revenue Recognition (4)
- risk-coal-07: Early revenue recognition (cut-off)
- risk-coal-08: HBA pricing with quality adjustments
- risk-coal-09: Related party disclosure
- risk-coal-10: Foreign exchange gain/loss

### Cost Classification (3)
- risk-coal-11: Overburden removal capex vs opex
- risk-coal-12: Mine development capitalization
- risk-coal-13: Reclamation cost classification

### Reclamation Provision (3)
- risk-coal-14: ARO recognition PSAK compliance
- risk-coal-15: Provision update with mine plan changes
- risk-coal-16: Progressive reclamation recording

### Royalty & Tax (3)
- risk-coal-17: Royalty calculation Permen ESDM
- risk-coal-18: DMO vs export allocation
- risk-coal-19: Special mining tax compliance

### Environmental (3)
- risk-coal-20: AMDAL/UKL-UPL compliance
- risk-coal-21: AMDAL approval for expansion
- risk-coal-22: Quarterly environmental reporting

---

## Testing Notes

### Build Status
✅ **Build successful** - No errors

### Verified Scenarios
✅ RCM list displays all 8 RCMs  
✅ BPM diagrams render in React Flow format  
✅ Controls linked to respective RCMs  
✅ Deficiencies display with correct severity  
✅ Risk library filters by "Industri Mineral dan Batubara" cluster  
✅ No console errors during navigation  

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (WebKit)

---

## Change Log

**Date:** 2026-03-31  
**Change:** Replace generic mock data with coal mining context  
**Entity:** PT Batubara Nusantara Sejahtera (Fictional)  
**Reason:** Demo realism untuk BUMN pertambangan batubara

**Files Modified:**
- `shared/mock-data.ts` (full replace - 957 lines)
- `openspec/changes/enhance-mock-data-coal-mining/` (all artifacts)
- `src/pages/csa/CSAWorkspace.tsx` (XCircle icon fix)

**Build Verification:**
```bash
bun run build
✓ built in 12.13s
```

---

## Contact

For questions about this mock data documentation, contact the development team.
