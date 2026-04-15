## ADDED Requirements

### Requirement: MaterialitySimulation Type Enhancement
Tipe data `MaterialitySimulation` SHALL menyertakan properti `significantAccounts` yang berisi daftar akun signifikan yang ditentukan selama proses Scoping.

#### Scenario: Interface includes significantAccounts property
- **WHEN** developer mengimpor tipe `MaterialitySimulation` dari `@shared/types`.
- **THEN** properti `significantAccounts` dengan tipe `SignificantAccount[]` harus tersedia.

#### Scenario: API consistency
- **WHEN** sistem melakukan fetch simulasi dari `/api/simulations`.
- **THEN** data yang diterima dapat di-cast ke tipe `MaterialitySimulation` tanpa kehilangan properti `significantAccounts`.
