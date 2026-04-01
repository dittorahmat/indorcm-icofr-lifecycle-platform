## ADDED Requirements

### Requirement: AI & Analytics Hub
The system SHALL provide a "Digital Analytics Hub" tab in the Reports page.

#### Scenario: Navigating the hub
- **WHEN** user clicks "Digital Analytics Hub"
- **THEN** the system SHALL show three sub-sections: "Data Analytics", "AI Use Cases", and "CCM Monitoring".

### Requirement: Data Analytics View (Slide 8)
The system SHALL visualize mining-specific analytics.

#### Scenario: Viewing analytics cards
- **WHEN** the Data Analytics section is viewed
- **THEN** it SHALL display metrics for:
    - Stockpile vs Sales Variance (%)
    - Weighbridge Difference Detection
    - Abnormal Journal Entry Counter
    - Cost per Ton Analysis (Mock Chart)

### Requirement: AI Use Case Grid (Slide 9)
The system SHALL explain AI capabilities available for ICoFR.

#### Scenario: Exploring AI features
- **WHEN** the AI Use Cases section is viewed
- **THEN** it SHALL show feature cards for: Fraud Detection, NLP Contract Review, and Vendor Risk Scoring.

### Requirement: Continuous Control Monitoring (Slide 10)
The system SHALL simulate a real-time control health dashboard.

#### Scenario: Monitoring alerts
- **WHEN** the CCM section is viewed
- **THEN** it SHALL show a "Live Alert Stream" with mock entries like:
    - [ALERT] Potential PO Split detected in Procurement.
    - [ALERT] Backdated journal entry (30 days) identified.
    - [HEALTH] Weighbridge system operating effectively.
