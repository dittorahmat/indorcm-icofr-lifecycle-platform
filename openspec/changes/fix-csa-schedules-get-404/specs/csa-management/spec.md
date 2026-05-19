## MODIFIED Requirements

### Requirement: Get CSA Schedules List
Sistem HARUS menyediakan endpoint API tunggal yang konsisten untuk mengambil daftar jadwal CSA yang terdaftar dalam database, menggantikan endpoint yang tidak lengkap atau duplikat.

#### Scenario: Unified Schedule Retrieval
- **WHEN** Pengguna memicu pengambilan data jadwal
- **THEN** Sistem HARUS merespons melalui endpoint `/api/csa/schedules` yang valid
- **AND** Data yang dikembalikan HARUS difilter berdasarkan `organizationId` pengguna yang sedang login.
