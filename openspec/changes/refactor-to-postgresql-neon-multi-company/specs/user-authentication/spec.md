## ADDED Requirements

### Requirement: Better Auth Integration
Sistem WAJIB menggunakan Better Auth untuk manajemen user dan session. Sistem login mock saat ini harus diganti dengan sistem autentikasi yang aman dan mendukung password hashing serta JWT session management.

#### Scenario: User Login with Organization Scope
- **WHEN** user melakukan login
- **THEN** sistem memverifikasi kredensial dan mengembalikan session yang mencakup list organisasi (BUMN) yang dapat diakses oleh user tersebut.

### Requirement: Role-Based Access Control (RBAC)
Sistem WAJIB mendukung role Lini 1, Lini 2, Lini 3, CFO, Komut, dan Admin. Izin akses (Permissions) harus divalidasi di setiap request API.

#### Scenario: Unauthorized Access Attempt
- **WHEN** user Lini 1 mencoba mengakses endpoint approval CFO
- **THEN** sistem menolak request dan mengembalikan status code 403 Forbidden.
