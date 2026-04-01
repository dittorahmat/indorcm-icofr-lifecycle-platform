## 1. Persiapan dan Backup

- [x] 1.1 Backup HomePage.tsx menjadi HomePage.backup.tsx
- [x] 1.2 Verifikasi struktur folder src/pages
- [x] 1.3 Review mock-data.ts untuk user credentials

## 2. Login Page Implementation

- [x] 2.1 Buat LoginPage.tsx component di src/pages/
- [x] 2.2 Implementasi form email + password dengan validation
- [x] 2.3 Implementasi mock authentication logic (email pattern matching)
- [x] 2.4 Integrasi login API call ke /api/auth/login
- [x] 2.5 Tambahkan credential helper text untuk demo
- [x] 2.6 Styling dengan gradient background dan Framer Motion animations

## 3. Welcome Page Implementation

- [x] 3.1 Buat WelcomePage.tsx component di src/pages/
- [x] 3.2 Implementasi branding "PT BUMN Sejahtera"
- [x] 3.3 Tambahkan tombol "Get Started" navigasi ke dashboard
- [x] 3.4 Styling dengan visual continuity dari landing page

## 4. Routing Updates

- [x] 4.1 Update main.tsx - tambahkan route / untuk LoginPage
- [x] 4.2 Update main.tsx - tambahkan route /welcome untuk WelcomePage
- [x] 4.3 Implementasi route protection untuk authenticated routes
- [x] 4.4 Redirect logic: login → welcome → dashboard

## 5. MainHeader Updates

- [x] 5.1 Hapus role switcher dropdown dari MainHeader.tsx
- [x] 5.2 Simplify header - hanya user profile dropdown
- [x] 5.3 Update logout functionality (clear localStorage)

## 6. Testing dan Verification

- [x] 6.1 Test login flow untuk semua 5 roles
- [x] 6.2 Test welcome screen navigation
- [x] 6.3 Test route protection (unauthenticated access)
- [x] 6.4 Test logout dan re-login flow
- [x] 6.5 Build verification - pastikan tidak ada compile errors
