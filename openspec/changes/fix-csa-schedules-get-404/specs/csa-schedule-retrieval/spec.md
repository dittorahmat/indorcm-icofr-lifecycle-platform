## ADDED Requirements

### Requirement: Get CSA Schedules List
Sistem HARUS menyediakan endpoint API untuk mengambil daftar jadwal CSA yang terdaftar dalam database.

#### Scenario: Successful Retrieval of Schedules
- **WHEN** Pengguna mengakses halaman Todo List
- **THEN** Sistem melakukan permintaan GET ke `/api/csa/schedules`
- **AND** Sistem mengembalikan daftar objek jadwal yang berisi `id`, `bpmProcessId`, `plannedDate`, `type`, dan `status` dengan status kode 200 OK.
