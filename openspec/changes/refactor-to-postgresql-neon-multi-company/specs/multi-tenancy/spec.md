## ADDED Requirements

### Requirement: Organizational Data Isolation
Sistem WAJIB memisahkan seluruh data entitas (GL, RCM, Control, Audit Log) berdasarkan `organization_id`. User hanya boleh mengakses data yang termasuk dalam organisasi tempat mereka terdaftar.

#### Scenario: Data Creation with Organization Scope
- **WHEN** user membuat entitas baru (misal: RCM baru)
- **THEN** sistem secara otomatis menyematkan `organization_id` yang sedang aktif ke dalam record database tersebut.

#### Scenario: Data Querying with Organization Scope
- **WHEN** user memanggil endpoint list (misal: GET /api/rcm)
- **THEN** sistem WAJIB melakukan filter `WHERE organization_id = current_org_id` pada query database.

### Requirement: Multi-Company Hierarchy Support
Sistem WAJIB mendukung struktur BUMN Induk dan Anak Perusahaan. User dengan level akses tertentu di Induk dapat berpindah konteks (switch) ke Anak Perusahaan.

#### Scenario: Organization Switching
- **WHEN** user kantor pusat memilih anak perusahaan dari switcher UI
- **THEN** sistem memperbarui session active organization dan memuat ulang data sesuai konteks anak perusahaan tersebut.
