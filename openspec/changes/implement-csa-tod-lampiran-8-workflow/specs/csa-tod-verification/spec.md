## ADDED Requirements

### Requirement: Transposed CSA Matrix View
The system SHALL provide a tabular pivot view (transposed matrix) within the `CSAPage` for each CSA record, where Controls are displayed as rows and Transactions/Samples are displayed as columns.

#### Scenario: Expanding a CSA record
- **WHEN** the user clicks on a CSA record in the `CSAPage` list
- **THEN** the row SHALL expand to display a grid showing all controls linked to the process
- **AND** the columns SHALL represent the individual samples tested by Line 1
- **AND** each cell SHALL provide a link or icon to view the evidence uploaded by Line 1

### Requirement: Single-Control TOD Entry (Lampiran 8)
The system SHALL display a dedicated popup form for "Lampiran 8 - Verifikasi Rancangan Pengendalian" when a specific control row is clicked within the transposed matrix.

#### Scenario: Opening the TOD popup
- **WHEN** the user clicks on a Control ID or Name in the transposed matrix
- **THEN** a modal SHALL open displaying the Lampiran 8 form for that specific control
- **AND** the form SHALL display the full **Risk Context** from the RCM (Risk Description, Fraud Related, Risk Rating)
- **AND** the form SHALL include 6 **Free-Text Justification Fields** for design evaluation (Pencapaian Objektif, Ketepatan Waktu, Wewenang, Keandalan Informasi, Periode Cakupan, Bukti yang Tersedia).
- **AND** the form SHALL include fields for **KK Reference** and a final **Design Conclusion** (Effective/Ineffective).

### Requirement: Automated Pre-population from RCM
The system SHALL automatically populate the control attributes in the Lampiran 8 TOD form using data from the master Risk Control Matrix (RCM).

#### Scenario: Loading the TOD form
- **WHEN** the Lampiran 8 popup is opened for a control
- **THEN** the system SHALL retrieve and display the control's Reference Number, Description, IPO, Assertions, and Frequency from the RCM as read-only fields.
