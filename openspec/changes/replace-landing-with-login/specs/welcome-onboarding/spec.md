## ADDED Requirements

### Requirement: Welcome Screen Display

Sistem SHALL menampilkan welcome screen setiap kali user berhasil login (setiap sesi).

**Content:**
- Company name: "PT BUMN Sejahtera"
- Welcome message: "Selamat Datang di IndoRCM Pro"
- Tagline: "Enterprise ICOFR Lifecycle Platform for Compliance with SK-5/DKU.MBU/11/2024"
- Get Started button

#### Scenario: Welcome screen setelah login
- **WHEN** user berhasil login dan diredirect ke /welcome
- **THEN** sistem menampilkan welcome screen dengan branding PT BUMN Sejahtera

#### Scenario: Welcome screen navigation
- **WHEN** user klik tombol "Get Started"
- **THEN** sistem redirect user ke /dashboard

### Requirement: Welcome Screen Visual Design

Welcome screen SHALL menggunakan visual style yang konsisten dengan landing page existing:
- Gradient background
- Modern typography
- Framer Motion animations untuk entrance effects
- Color scheme: primary, muted, foreground dari design system

#### Scenario: Visual consistency
- **WHEN** welcome screen ditampilkan
- **THEN** menggunakan gradient background, typography, dan animations yang sama dengan landing page

### Requirement: Session-based Welcome Trigger

Welcome screen SHALL muncul setiap kali user memulai sesi baru (setiap kali login).

#### Scenario: Welcome muncul setiap sesi
- **WHEN** user logout dan login kembali
- **THEN** welcome screen ditampilkan lagi (tidak di-skip)

#### Scenario: Welcome tidak muncul saat refresh dashboard
- **WHEN** user sudah di dashboard dan refresh page
- **THEN** welcome screen tidak ditampilkan, user tetap di dashboard
