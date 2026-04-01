## ADDED Requirements

### Requirement: Auto-Detect Column Mapping

Sistem SHALL auto-detect column mapping untuk berbagai format GL dengan support multiple naming conventions.

**Supported Column Variations:**

| Field | Priority Column Names |
|-------|----------------------|
| accountCode | No_GL, Kode_GL, AccountCode, Account Code, Code |
| accountName | GL_Desc, GLDesc, AccountName, Account Name, Account, Description |
| balance | GL_Balance, GLBalance, Balance, Amount, EndingBalance, Saldo |
| fsliCode | Kode_FSLI, FSLICode, FSLI_Code, FSLI |
| entityCode | Kode_Entity, EntityCode, Entity_Code, Kode_Cabang |
| currency | Kode_Valuta, Currency, Valuta, Curr |

**Detection Algorithm:**
1. Scan CSV headers
2. Match each header against priority list
3. Assign first match per field
4. Return mapping object

#### Scenario: Sample Data GL.csv detection
- **WHEN** user uploads file dengan headers: YMD;Kode_Entity;No_GL;GL_Desc;Kode_Valuta;GL_Balance;Kode_FSLI
- **THEN** sistem detect mapping: No_GL→accountCode, GL_Desc→accountName, GL_Balance→balance

#### Scenario: Standard CSV detection
- **WHEN** user uploads file dengan headers: Account, Balance, Amount
- **THEN** sistem detect mapping: Account→accountName, Balance→balance

#### Scenario: Partial mapping found
- **WHEN** user uploads file dengan headers: Account_Name, Amount (missing account code)
- **THEN** sistem detect partial mapping dan show warning "Some required columns not found"

### Requirement: FSLI Code Support

Sistem SHALL support mapping dan storage of Financial Statement Line Item (FSLI) codes dari GL data.

**FSLI Code Categories:**
- 1010100: Kas dan Setara Kas
- 1010201: Piutang Usaha
- 1011000: Persediaan
- 6010000: Pendapatan
- 6100000: Beban Pokok Pendapatan

#### Scenario: FSLI code detected
- **WHEN** GL file contains Kode_FSLI column
- **THEN** sistem map dan store FSLI code untuk setiap account

#### Scenario: FSLI-based grouping
- **WHEN** displaying GL data
- **THEN** sistem group accounts by FSLI code untuk financial statement presentation

### Requirement: Entity Code Support

Sistem SHALL support mapping Kode_Entity untuk multi-entity GL data.

#### Scenario: Multi-entity GL
- **WHEN** GL file contains multiple entity codes (0101, 0102, etc.)
- **THEN** sistem detect dan track entity untuk setiap GL row

#### Scenario: Entity filtering
- **WHEN** viewing GL data
- **THEN** user dapat filter by entity code
