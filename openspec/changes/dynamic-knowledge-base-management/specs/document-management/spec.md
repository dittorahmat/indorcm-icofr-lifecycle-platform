## ADDED Requirements

### Requirement: Upload PDF with Metadata
The system SHALL allow users to upload PDF documents and associate them with metadata including Type (Internal/External), Category (SOP/Regulation/etc), and links to Departments, GL Accounts, and FSLI items.

#### Scenario: Successful upload of Internal SOP
- **WHEN** user uploads a PDF, selects "Internal", and chooses "Finance" department
- **THEN** system extracts text, saves the file to R2, and creates database records for the document and department link

### Requirement: Role-Based Document Access
The system SHALL restrict access to Internal documents based on the user's department and role.

#### Scenario: Line 1 user listing documents
- **WHEN** a user with "Line 1" role from "Finance" department views the "Internal" tab
- **THEN** system SHALL only show documents tagged with "Finance" or "All Departments"

#### Scenario: Line 2/3 user listing documents
- **WHEN** a user with "Line 2" or "Line 3" role views the "Internal" tab
- **THEN** system SHALL show all internal documents from all departments

### Requirement: Document Deletion with Cleanup
The system SHALL ensure that deleting a document record also removes its associated physical file from R2 storage.

#### Scenario: Successful deletion
- **WHEN** admin deletes a document from the UI
- **THEN** system removes the database record and deletes the corresponding object in the R2 bucket
