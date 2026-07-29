## Context

Platform IndoGRC Pro menghadapi kebutuhan kustomisasi visual dan integrasi SSO untuk dua tipe partner:
1. **Perusahaan A**: Whitelabel penuh (Standalone App, custom logo, theme, dan domain).
2. **Perusahaan B**: Embedded Module di dalam aplikasi Blazor / .NET Core mereka, membutuhkan mode tanpa header/sidebar, SSO JWT bridge, theme matching (Microsoft/Blazor look-and-feel), dan mirror sync ke GitLab Perusahaan B.

Arsitektur yang dipilih adalah **Config-Driven Single Codebase**, di mana seluruh varian berjalan dari codebase `main` tanpa perlu branch Git terpisah untuk tiap klien.

## Goals / Non-Goals

**Goals:**
- Mengimplementasikan `TenantProvider` dan React Context untuk membaca konfigurasi runtime tenant.
- Mengabstraksikan token CSS variables untuk mendukung dynamic theme (Core, Tenant A, Tenant B).
- Mendukung `isEmbedded` mode di `AppLayout` untuk menyembunyikan header/sidebar bawaan.
- Menyediakan Auth Adapter yang mampu membaca JWT dari query param/postMessage untuk SSO PT B.
- Menyiapkan panduan dan script CI/CD untuk otomatisasi Git Mirroring ke GitLab Perusahaan B.

**Non-Goals:**
- Menulis ulang komponen React menjadi Blazor C# (PT B di-embed via iframe/embedded SPA).
- Mengintegrasikan data sinkronisasi OpRisk <-> ICOFR secara dua arah di Phase 1 (fokus Phase 1: SSO, Theme, & Embedding).

## Decisions

### 1. Single Codebase vs Multi-Branch Strategy
- **Keputusan**: Menggunakan **Single Codebase Config-Driven**. Semua logic tenant disimpan di `main` dan dikendalikan via `VITE_TENANT_ID` atau runtime config.
- **Alternatif**: Git Branch per client (Ditolak karena berisiko *git merge conflict hell* saat ada perbaikan bug di core).

### 2. Embedded Layout Rendering
- **Keputusan**: Menggunakan toggle `isEmbedded: true` pada `AppLayout`. Jika aktif, `Sidebar` dan `Header` disembunyikan, dan area main content dirender 100% width/height.
- **Alternatif**: Menulis ulang layout terpisah (Ditolak karena menduplikasi komponen wrapper).

### 3. Dynamic Theme Tokens (CSS Variables)
- **Keputusan**: Menerapkan atribut `data-tenant="<tenant_id>"` pada elemen root `:root`, yang meng-override CSS variables (Tailwind & Shadcn UI tokens) seperti `--primary`, `--radius`, `--sidebar-width`.
- **Alternatif**: Hardcoded Conditional Tailwind Class (Ditolak karena sulit dipelihara dan rentan bocor visual).

### 4. Git Synchronization (GitLab Perusahaan B)
- **Keputusan**: Menggunakan **Automated Mirror Sync (Dual-Push/GitHub Actions)**. Branch `main` otomatis di-push ke GitLab Perusahaan B sebagai target release/mirror.
- **Alternatif**: Manual Merge Request ke GitLab PT B (Ditolak karena tidak efisien).

## Risks / Trade-offs

- **[Risk] PostMessage / JWT Security di Iframe**: Token JWT bisa terekspos jika domain parent Blazor tidak divalidasi.
  - *Mitigasi*: Validasi `origin` di event listener `postMessage` hanya menerima domain yang diizinkan oleh Perusahaan B.
- **[Risk] Style Pollution dari Host App (jika non-iframe)**: CSS host app bisa merusak UI React.
  - *Mitigasi*: Rekomendasi utama menggunakan Iframe / Shadow DOM / CSS Isolation.
