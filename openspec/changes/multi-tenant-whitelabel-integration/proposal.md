## Why

Platform IndoGRC Pro memerlukan arsitektur multi-tenant berbasis konfigurasi (Config-Driven Multi-Tenant Architecture) untuk mendukung ekspansi bisnis whitelabel (Perusahaan A) dan integrasi kolaborasi ter-embed (Perusahaan B). Perusahaan B menggunakan Microsoft Stack (Blazor, .NET Core, SQL Server) dan mewajibkan Single Sign-On (SSO JWT) serta pencerminan kode (auto-mirroring) ke GitLab mereka. Dengan pendekatan ini, seluruh varian klien tetap dikembangkan dari satu codebase utama (`main`), menghindari *git merge conflict hell* dan meminimalkan biaya perawatan.

## What Changes

- **Multi-Tenant Configuration Engine**: Menambahkan abstraksi tenant config (TenantContext/Provider) untuk mengelola metadata tenant (`default`, `company_a`, `company_b`).
- **Dynamic Theme Tokens System**: Mengabstraksikan tema warna, font, dan border radius menggunakan CSS variables yang dapat diganti secara dinamis sesuai identitas visual Perusahaan A atau Perusahaan B (Blazor-matched).
- **Embedded Layout Mode**: Menambahkan toggle layout mode (`isEmbedded: true`) untuk menyembunyikan Sidebar & Top Header bawaan saat aplikasi di-embed di dalam iframe/container Blazor Perusahaan B.
- **Pluggable Auth Adapter (JWT SSO)**: Menambahkan Auth Adapter yang mampu membaca dan memvalidasi JWT token dari URL parameter/postMessage dari aplikasi parent Perusahaan B.
- **CI/CD GitLab Mirror Pipeline**: Dokumentasi dan script/workflow CI/CD untuk otomatisasi pencerminan (*mirroring*) branch `main` ke repository GitLab Perusahaan B.

## Capabilities

### New Capabilities
- `multi-tenant-config`: Pengelolaan konfigurasi tenant, pembacaan environment variable, dan context provider React.
- `dynamic-theme-tokens`: Penerapan variabel CSS dinamis untuk kustomisasi Look & Feel (Theme A & Theme B).
- `embedded-layout-mode`: Mode visual tanpa header/sidebar untuk kebutuhan embedding SPA ke platform host.
- `jwt-sso-adapter`: Adapter autentikasi yang mendukung pembacaan dan konfirmasi JWT dari host app PT B.

### Modified Capabilities
- None

## Impact

- **Frontend Codebase**: `src/shared/`, `src/App.tsx`, `src/components/layout/`, `src/styles/`
- **Authentication**: `src/context/` atau `src/providers/` untuk Auth & Tenant state.
- **Build & CI/CD**: `.github/workflows/` atau script deployment untuk Git Mirroring ke GitLab Perusahaan B.
