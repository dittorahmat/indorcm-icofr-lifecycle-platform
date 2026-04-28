## ADDED Requirements
### Requirement: SOC 7-Point Eval
Sistem WAJIB menyediakan form 7 kriteria (SK-5 Hal 40).
#### Scenario: Eval Success
- **WHEN** auditor centang 7 poin "Ya"
- **THEN** status "Compliant".
### Requirement: Auto Expiry
#### Scenario: Expired
- **WHEN** hari ini > periodEnd
- **THEN** status "Expired" (Merah).
