## ADDED Requirements

### Requirement: Mock Email-Password Authentication

Sistem SHALL menyediakan mock authentication menggunakan email dan password untuk simulasi role-based access. Email pattern menentukan role user yang akan login.

**Credential Mapping:**
| Email | Role | User Name |
|-------|------|-----------|
| line1@bumn.go.id | Line 1 | Alice (Process Owner) |
| line2@bumn.go.id | Line 2 | Bob (ICOFR Manager) |
| line3@bumn.go.id | Line 3 | Charlie (Internal Auditor) |
| admin@bumn.go.id | Admin | Diana (Admin) |
| external@bumn.go.id | External Auditor | Evan (KAP Partner) |

**Password:** Semua akun menggunakan password `password` (hardcoded untuk mock)

#### Scenario: Successful login dengan valid credentials
- **WHEN** user memasukkan email yang valid (mis. line1@bumn.go.id) dan password "password"
- **THEN** sistem mengautentikasi user dan menyimpan token di localStorage

#### Scenario: Login dengan email tidak dikenal
- **WHEN** user memasukkan email yang tidak sesuai pattern (mis. user@gmail.com)
- **THEN** sistem menampilkan error "Invalid credentials"

#### Scenario: Login dengan password salah
- **WHEN** user memasukkan email valid tetapi password salah
- **THEN** sistem menampilkan error "Invalid credentials"

#### Scenario: Role assignment berdasarkan email
- **WHEN** user login dengan line2@bumn.go.id
- **THEN** sistem set role user sebagai "Line 2" dan menyimpan di localStorage

### Requirement: Login Form UI

Login page SHALL menampilkan form dengan:
- Email input field
- Password input field (type="password")
- Sign In button
- Credential helper text (opsional, untuk demo)

#### Scenario: Form validation - empty fields
- **WHEN** user klik Sign In tanpa mengisi email atau password
- **THEN** sistem menampilkan validation error "Email dan password wajib diisi"

#### Scenario: Form validation - email format
- **WHEN** user memasukkan email tanpa format valid (tanpa @)
- **THEN** sistem menampilkan validation error "Format email tidak valid"

#### Scenario: Successful login navigation
- **WHEN** user login dengan credentials valid
- **THEN** sistem redirect ke /welcome page

### Requirement: Token Storage

Sistem SHALL menyimpan authentication token di localStorage setelah successful login.

#### Scenario: Token generation setelah login
- **WHEN** user berhasil login
- **THEN** sistem generate JWT-like token dan simpan di localStorage dengan key `authToken`

#### Scenario: User data storage setelah login
- **WHEN** user berhasil login
- **THEN** sistem simpan user info (id, name, role) di localStorage
