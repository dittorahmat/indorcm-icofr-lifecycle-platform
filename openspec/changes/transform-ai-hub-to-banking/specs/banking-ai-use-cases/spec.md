## ADDED Requirements

### Requirement: Banking Domain Mock Data
The system SHALL provide a comprehensive set of mock data tailored for the banking sector, including Anti-Money Laundering (AML) alerts, Loan Contract Review findings, and Non-Performing Loan (NPL) metrics.

#### Scenario: Display banking use cases
- **WHEN** a user navigates to the AI Use Cases tab
- **THEN** the system SHALL display scenarios such as "Fraud Transaction Pattern" and "Loan Portfolio Analysis" instead of mining scenarios.

### Requirement: Dynamic Organization Branding
The AI Analytics Hub SHALL dynamically retrieve and display the organization name and logo from the system settings instead of using hardcoded values.

#### Scenario: Reflect changes in settings
- **WHEN** the user updates the company name in the Settings page to "PT Bank Mandiri"
- **THEN** the AI Analytics Hub SHALL display "PT Bank Mandiri" in the header and reports.

### Requirement: Banking KPI Visualizations
The system SHALL display domain-specific visualizations for banking, specifically comparing CASA (Current Account Savings Account) growth vs. Loan Disbursement, and a heatmap for NPL ratios.

#### Scenario: View banking analytics
- **WHEN** a user views the Data Analytics tab in the Banking cluster
- **THEN** the system SHALL show an Area Chart for CASA/Loan trends and a Gauge chart for NPL status.
