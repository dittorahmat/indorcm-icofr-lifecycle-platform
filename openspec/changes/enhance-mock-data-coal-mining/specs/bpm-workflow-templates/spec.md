## ADDED Requirements

### Requirement: BPM Workflow Templates - Revenue Cycle

Sistem SHALL provide BPM diagram untuk Coal Sales & Revenue cycle dengan 8-10 nodes.

**Workflow: Coal Sales to Revenue**
```
START → Sales Order → Credit Check → Sales Contract → 
Weighbridge Weighing → Quality Analysis → Issue Invoice → 
Recognize Revenue → END

Risk Points:
- Credit risk (bad debt)
- Volume measurement error (weighbridge)
- Quality dispute (GAR/TM/Ash)
- Pricing error (HBA calculation)
- Revenue timing (cut-off)

Control Points:
- Credit limit approval (FIN-01)
- Weighbridge calibration (LOG-01)
- Quality certificate approval (QC-01)
- HBA price verification (BILL-01)
- Revenue recognition review (ACC-01)
```

#### Scenario: Revenue BPM loaded
- **WHEN** user opens "Coal Sales Contract" RCM
- **THEN** sistem display BPM dengan 8-10 nodes

#### Scenario: Revenue BPM interactive
- **WHEN** user clicks on risk node
- **THEN** sistem show risk description dan linked controls

### Requirement: BPM Workflow Templates - Production Cycle

Sistem SHALL provide BPM diagram untuk Coal Extraction dengan 8-10 nodes.

**Workflow: Coal Extraction**
```
START → Mine Planning → Overburden Removal → 
Coal Extraction → Coal Crushing → Stockpile → 
Production Report → END

Risk Points:
- Over/under estimation of reserves
- Overburden removal cost misclassification
- Production volume measurement error
- Equipment downtime
- Safety incidents

Control Points:
- Mine plan approval (TECH-01)
- Capex vs opex review (ACC-02)
- Weighbridge reconciliation (LOG-02)
- Production report review (PROD-01)
```

#### Scenario: Production BPM loaded
- **WHEN** user opens "Coal Extraction" RCM
- **THEN** sistem display BPM dengan 8-10 nodes

### Requirement: BPM Workflow Templates - Procurement Cycle

Sistem SHALL provide BPM diagram untuk Mining Contractor Services dengan 6-8 nodes.

**Workflow: Contractor Services Procurement**
```
START → Contractor Selection → Contract Approval → 
Service Execution → Work Verification → Invoice Approval → 
Payment → END

Risk Points:
- Contractor qualification inadequate
- Contract terms unfavorable
- Work not performed as specified
- Invoice overbilling
- Payment without approval

Control Points:
- Contractor pre-qualification (PROC-01)
- Contract legal review (LEGAL-01)
- Work completion certificate (ENG-01)
- 3-way match (PROC-02)
- Payment approval (FIN-02)
```

#### Scenario: Procurement BPM loaded
- **WHEN** user opens "Mining Contractor Services" RCM
- **THEN** sistem display BPM dengan 6-8 nodes

### Requirement: BPM Workflow Templates - Fixed Assets

Sistem SHALL provide BPM diagram untuk Mine Development Capitalization dengan 6-8 nodes.

**Workflow: Mine Development (Capex)**
```
START → Project Approval → Engineering Design → 
Construction → Capitalization Review → 
Asset Registration → Depreciation → END

Risk Points:
- Capex vs opex misclassification
- Project cost overrun
- Asset impairment not identified
- Depreciation calculation error

Control Points:
- Capex budget approval (MGMT-01)
- Capitalization criteria review (ACC-03)
- Asset registration (FA-01)
- Depreciation review (ACC-04)
```

#### Scenario: Fixed Assets BPM loaded
- **WHEN** user opens "Mine Development Capitalization" RCM
- **THEN** sistem display BPM dengan 6-8 nodes

### Requirement: BPM Workflow Templates - Reclamation

Sistem SHALL provide BPM diagram untuk ARO Provision & Progressive Reclamation dengan 6-8 nodes.

**Workflow: ARO Accounting**
```
START → Mine Plan Review → ARO Calculation → 
Third-party Verification → Provision Booking → 
Progressive Reclamation → Annual Review → END

Risk Points:
- ARO provision understated
- Calculation methodology error
- Third-party report not obtained
- Progressive reclamation not tracked
- Regulatory non-compliance

Control Points:
- ARO methodology approval (TECH-02)
- Third-party consultant review (ENV-01)
- Provision calculation review (ACC-05)
- Regulatory compliance check (ENV-02)
```

#### Scenario: Reclamation BPM loaded
- **WHEN** user opens "ARO Provision Calculation" RCM
- **THEN** sistem display BPM dengan 6-8 nodes

### Requirement: BPM Format Compatibility

Sistem SHALL provide BPM diagrams dalam React Flow compatible format.

**Format Requirements:**
- Nodes dengan type: start, activity, risk, control, end, archive
- Position coordinates (x, y) untuk layout
- Edges dengan source dan target
- Data labels untuk display

#### Scenario: BPM format valid
- **WHEN** BPM data loaded
- **THEN** React Flow dapat render tanpa errors

#### Scenario: BPM layout correct
- **WHEN** BPM displayed
- **THEN** nodes arranged top-to-bottom dengan proper spacing
