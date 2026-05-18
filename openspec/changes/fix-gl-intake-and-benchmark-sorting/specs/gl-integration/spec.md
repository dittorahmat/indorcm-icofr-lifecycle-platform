## MODIFIED Requirements

### Requirement: Manual GL Upload:
-   Must support `.csv` files.
-   Must extract account names and ending balances.
-   Must automatically mark accounts as `Significant` if `balance >= PM`.
-   Must append newly uploaded accounts to the existing scoping matrix.
-   **MODIFIED**: Sistem HARUS mengizinkan baris yang memiliki `fsliName` valid untuk diimpor meskipun `glDesc` kosong.

#### Scenario: Successful export
- **WHEN** user clicks "Export" button
- **THEN** system downloads a CSV file with all user data

#### Scenario: Baris FSLI Subtotal terdeteksi
- **WHEN** Pengguna mengunggah file dengan baris "TOTAL ASET" sebagai fsliName tapi glDesc kosong
- **THEN** Baris tersebut tidak di-filter (tetap dipertahankan) dalam proses parsing
