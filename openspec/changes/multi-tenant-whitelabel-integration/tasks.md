## 1. Multi-Tenant Architecture & Configuration Setup

- [x] 1.1 Buat tipe data `TenantConfig` dan definisi preset di `src/shared/tenantConfig.ts` (`default`, `company_a`, `company_b`).
- [x] 1.2 Implementasikan `TenantContext` dan React Provider di `src/context/TenantContext.tsx` untuk mendeteksi tenant dari `VITE_TENANT_ID` atau query param `?tenant=`.

## 2. Dynamic Styling & CSS Variable Theme Tokens

- [x] 2.1 Tambahkan file preset CSS Theme untuk Perusahaan B di `src/styles/tenants/company_b.css` (Microsoft/Blazor blue theme).
- [x] 2.2 Hubungkan `TenantContext` dengan pengubah atribut `:root` (`data-tenant="..."`) untuk pengantian tema otomatis.

## 3. Embedded Layout & SSO JWT Adapter

- [x] 3.1 Modifikasi `AppLayout` untuk mendukung mode `isEmbedded: true` (menyembunyikan `Sidebar` dan `Header` saat di-embed di Iframe Blazor PT B).
- [x] 3.2 Implementasikan `JwtAuthAdapter` di `src/context/AuthContext.tsx` untuk membaca dan memvalidasi JWT token dari URL parameter/postMessage window.

## 4. Documentation & CI/CD GitLab Auto-Mirroring

- [x] 4.1 Buat script / GitHub Actions workflow (`.github/workflows/gitlab-mirror.yml`) untuk otomatisasi push `main` ke GitLab Perusahaan B.
- [x] 4.2 Tambahkan panduan integrasi embedding Iframe & SSO JWT untuk tim teknis Perusahaan B.
