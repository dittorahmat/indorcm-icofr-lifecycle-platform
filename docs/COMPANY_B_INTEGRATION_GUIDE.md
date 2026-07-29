# Integration Guide: Embedding IndoGRC Pro in Company B (Blazor App)

## 1. Overview
Document ini berisi panduan teknis untuk mengintegrasikan **IndoGRC Pro (React ICOFR Module)** ke dalam aplikasi **GRC / Operational Risk (Blazor .NET Core)** milik Perusahaan B.

## 2. Embedding via Iframe
Aplikasi IndoGRC Pro dapat di-embed menggunakan Iframe HTML/Blazor dengan menambahkan parameter `tenant=company_b`:

```html
<iframe 
  src="https://icofr.indogrc.com/dashboard?tenant=company_b&token=YOUR_JWT_TOKEN" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  allow="fullscreen">
</iframe>
```

Saat `tenant=company_b` aktif, aplikasi IndoGRC Pro secara otomatis:
- Menyembunyikan Top Navigation & Sidebar bawaan (`isEmbedded: true`).
- Menerapkan Microsoft/Blazor theme color palette (`#0056b3`).

## 3. Single Sign-On (SSO) via JWT / PostMessage

### Opsi A: Passing via URL Parameter
Sertakan JWT token pada URL iframe:
`?tenant=company_b&token=<jwt_bearer_token>`

### Opsi B: Passing via Window `postMessage` (Recommended)
Kirimkan token dari Blazor JavaScript Interop ke iframe window:

```javascript
const iframeWindow = document.getElementById('icofr-iframe').contentWindow;
iframeWindow.postMessage({
  type: 'COMPANY_B_SSO_TOKEN',
  token: 'YOUR_JWT_BEARER_TOKEN'
}, 'https://icofr.indogrc.com');
```

## 4. Repository Mirroring (GitLab)
Source code aplikasi disinkronkan secara otomatis dari GitHub utama kami ke GitLab Perusahaan B via GitHub Actions (`.github/workflows/gitlab-mirror.yml`). 
Branch `main` di GitLab Perusahaan B selalu mencerminkan versi terbaru secara realtime.
