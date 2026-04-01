## Context

**Current State:**
- Entry point (`/`) adalah landing page dengan hero section, 5-step ICOFR lifecycle, dan stats cards
- Role switcher berada di MainHeader (top-right) untuk mock authentication
- Tidak ada login screen atau welcome screen
- HomePage.tsx berisi full landing page content

**Constraints:**
- Mock authentication tetap menggunakan token-based system yang sudah ada
- Visual style harus konsisten dengan landing page existing (gradient, modern, Framer Motion)
- Domain email menggunakan `bumn.go.id`
- Welcome screen selalu muncul setiap kali login (setiap sesi)

**Stakeholders:**
- Process Owners (Line 1)
- ICOFR Managers (Line 2)
- Internal Auditors (Line 3)
- Admin
- External Auditors (KAP)

## Goals / Non-Goals

**Goals:**
- Login screen dengan email + password mock authentication
- Role segregation berdasarkan email pattern (line1@, line2@, line3@, admin@, external@)
- Welcome screen dengan branding "PT BUMN Sejahtera"
- Menghapus role switcher dari MainHeader
- Route protection untuk authenticated routes
- Backup HomePage.tsx untuk referensi masa depan

**Non-Goals:**
- Backend authentication implementation (tetap mock)
- Password validation complexity (password tetap hardcoded "password")
- Session management changes (tetap menggunakan localStorage)
- Perubahan pada authorization logic yang sudah ada

## Decisions

### 1. Login Component Structure

**Decision:** Single LoginPage component dengan form email + password

**Rationale:**
- Simple dan straightforward untuk mockup
- Mudah dipahami oleh user yang mencoba berbagai role
- Konsisten dengan enterprise login patterns

**Alternatives Considered:**
- Quick role selector buttons (terlalu informal untuk enterprise context)
- Combined email + role dropdown (redundant, email sudah mengindikasikan role)

### 2. Authentication Flow

**Decision:** Email pattern matching untuk menentukan role

```
line1@bumn.go.id    → Line 1 (Process Owner)
line2@bumn.go.id    → Line 2 (ICOFR Manager)
line3@bumn.go.id    → Line 3 (Internal Auditor)
admin@bumn.go.id    → Admin
external@bumn.go.id → External Auditor
```

**Rationale:**
- Domain `bumn.go.id` sesuai dengan konteks BUMN
- Pattern sederhana mudah diingat untuk demo
- Scalable jika perlu menambah user lain di masa depan

### 3. Welcome Screen Behavior

**Decision:** Selalu muncul setelah setiap login (setiap sesi)

**Rationale:**
- Memberikan branding moment setiap kali user masuk
- Menampilkan "PT BUMN Sejahtera" sebagai company context
- Simple onboarding experience untuk demo

**Alternatives Considered:**
- First-login only (lebih kompleks, perlu tracking)
- Skip-able dengan checkbox (menambah kompleksitas UI)

### 4. Visual Design Continuity

**Decision:** Maintain existing visual style dari landing page

**Rationale:**
- Gradient background sudah sesuai dengan enterprise aesthetic
- Framer Motion animations memberikan polish
- Color scheme (primary, muted, card styles) sudah konsisten

### 5. Route Structure

**Decision:**
```
/           → LoginPage
/welcome    → WelcomePage
/dashboard  → Protected (requires auth)
/*          → Protected app routes
```

**Rationale:**
- Clear separation antara public dan protected routes
- Login sebagai entry point utama
- Welcome sebagai gate sebelum dashboard

## Risks / Trade-offs

**[Risk]** Role switcher removal membuat testing berbagai role lebih lambat

**→ Mitigation:** User dapat logout dan login dengan email berbeda, atau gunakan multiple browser tabs

**[Risk]** Welcome screen setiap sesi bisa terasa repetitive untuk power users

**→ Mitigation:** Untuk production nanti bisa ditambah opsi "Skip this next time" atau session-based tracking

**[Risk]** Mock credentials bisa lupa saat demo

**→ Mitigation:** Tampilkan credential helper di login page (small text di bawah form)

**[Trade-off]** Simplicity vs Realism - Mock auth dengan email pattern lebih simple tapi kurang realistis dibanding actual auth

**→ Acceptable** karena ini untuk mockup/demo purposes

## Migration Plan

### Steps to Deploy

1. Backup HomePage.tsx → HomePage.backup.tsx
2. Create LoginPage.tsx dengan form authentication
3. Create WelcomePage.tsx dengan branding screen
4. Update main.tsx routing
5. Update MainHeader.tsx (hapus role switcher)
6. Test semua role flows
7. Build dan verify tidak ada errors

### Rollback Strategy

- Restore HomePage.backup.tsx ke HomePage.tsx
- Revert main.tsx routing changes
- Revert MainHeader.tsx changes

## Open Questions

None - semua keputusan desain sudah finalized dari eksplorasi sebelumnya.
