## ADDED Requirements

### Requirement: Risk Heatmap Matrix (3x3)
The system SHALL display a 3x3 matrix combining Quantitative Factor (Y-axis) and Qualitative Factor (X-axis).

#### Scenario: Matrix Layout
- **WHEN** the heatmap is rendered
- **THEN** it SHALL show:
    - Y-Axis Labels: Low, Medium, High (Quantitative)
    - X-Axis Labels: Low, Medium, High (Qualitative)

### Requirement: Regulatory Color Coding (Tabel 12)
The system SHALL color each cell based on the combination outcome specified in SK-5/2024.

#### Scenario: High-High outcome
- **WHEN** Quantitative is "High" AND Qualitative is "High"
- **THEN** the cell SHALL be colored Red (Hex: #ef4444) and labeled "TINGGI".

#### Scenario: Low-Low outcome
- **WHEN** Quantitative is "Low" AND Qualitative is "Low"
- **THEN** the cell SHALL be colored Green (Hex: #22c55e) and labeled "RENDAH".

### Requirement: Interactive Mining Data Tooltips
The system SHALL display specific risks for **PT BATUBARA NUSANTARA SEJAHTERA** when hovering or clicking cells.

#### Scenario: High-High Risk drill-down
- **WHEN** user clicks the "High-High" cell
- **THEN** the system SHALL show:
    - Risk: Mark-up Biaya Kontraktor OB Removal
    - Risk: Manipulasi Tonase Coal Getting
    - Risk: Ketidakefektifan Reklamasi Tambang (ESG)
