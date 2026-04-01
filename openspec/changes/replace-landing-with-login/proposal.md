## Why

Saat ini aplikasi memiliki landing page yang informatif namun belum mencerminkan flow autentikasi yang sebenarnya. Untuk mockup yang lebih realistis dan sesuai dengan kebutuhan demonstrasi role-based access, kita perlu mengganti landing page dengan login screen yang memisahkan user berdasarkan role (Line 1, Line 2, Line 3, Admin, External Auditor).

## What Changes

- **Login Page**: Halaman login baru dengan email + password mock authentication
- **Welcome Screen**: Onboarding screen yang selalu muncul setelah login dengan branding "PT BUMN Sejahtera"
- **Role Switcher Removal**: Menghapus role switcher dropdown dari MainHeader (top-right)
- **Route Protection**: Login page menjadi entry point utama (`/`), dashboard dan routes lain memerlukan autentikasi
- **HomePage Backup**: Menyimpan HomePage.tsx sebagai backup untuk referensi masa depan

## Capabilities

### New Capabilities

- `login-authentication`: Mock authentication flow dengan email/password berdasarkan role
- `welcome-onboarding`: Welcome screen yang muncul setelah setiap login session

### Modified Capabilities

- `navigation-header`: Menghapus role switcher functionality, hanya menampilkan user profile dropdown

## Impact

- **Frontend Routes**: `main.tsx` perlu update routing untuk login dan welcome pages
- **MainHeader Component**: Menghapus role switcher dropdown, menyederhanakan header
- **Authentication Flow**: Token-based auth tetap sama, hanya entry point yang berubah
- **User Experience**: User flow sekarang: Login → Welcome → Dashboard
