## ADDED Requirements

### Requirement: Downloadable GL Template

Sistem SHALL provide downloadable GL template dalam format CSV dan XLSX.

**Template Content:**
- Sample headers: No_GL;GL_Desc;Kode_Valuta;GL_Balance;Kode_FSLI
- 5-10 sample rows dengan data contoh
- Comments/instructions dalam file
- Both semicolon-delimited (Indonesian) and comma-delimited versions

**Template Formats:**
- CSV (semicolon delimiter) - Indonesian standard
- CSV (comma delimiter) - International standard
- XLSX (Excel format)

#### Scenario: Download CSV template
- **WHEN** user clicks "Download Template"
- **THEN** download file "GL_Template.csv" dengan sample data

#### Scenario: Template instructions
- **WHEN** user opens template
- **THEN** see instructions untuk format yang diharapkan

### Requirement: Format Examples

Template SHALL include examples untuk berbagai scenario:

**Example Rows:**
```
No_GL;GL_Desc;Kode_Valuta;GL_Balance;Kode_FSLI
10008-000318;Kas-Bank;IDR;11622215994;1010100
13136-000916;Piutang Usaha;IDR;(94245245545);1010201
18094-000318;Persediaan;IDR;47357831548;1011000
```

#### Scenario: Negative balance example
- **WHEN** user views template
- **THEN** see example dengan parentheses untuk negative balance

#### Scenario: Format instructions
- **WHEN** user views template
- **THEN** see note "Gunakan period (.) untuk thousand separator, parentheses untuk negative"
