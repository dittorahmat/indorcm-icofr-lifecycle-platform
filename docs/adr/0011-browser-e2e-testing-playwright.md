# 0011 - Browser E2E Testing with Playwright in CI Pipeline

- **Status:** Accepted
- **Date:** 2026-11-19
- **Context:** Verifikasi interaksi visual browser, kanvas BPM React Flow (Lampiran 3 SK-5), dan alur form multi-persona di platform IndoGRC Pro.

## Problem

Pengujian otomatis saat ini mengandalkan:
1. Unit dan integration tests via Vitest di environment jsdom / Node (`npm test`).
2. Skenario domain E2E via `src/test/demo-scenario-e2e.test.ts`.

Keterbatasan:
- jsdom tidak menghitung layout nyata browser (CSS bounding boxes, overflow, canvas mouse dragging pada React Flow).
- Regresi interaktif visual (misal: node BPM tidak bisa digeser/dihubungkan, modal/drawer terpotong, atau table keyboard scrolling) tidak tertangkap oleh Vitest.
- Perlu dipastikan apakah pengujian ini berjalan di dalam script `deploy.sh` atau di CI GitHub Actions.

## Decision

1. **Adopsi Playwright untuk E2E Browser Testing:**
   - Menyediakan suite pengujian berbasis headless browser nyata (Chromium) untuk menguji alur pengguna kritis: otentikasi persona, interaksi tabel audit, alur scoping materialitas, dan manipulasi kanvas visual BPM React Flow.
2. **Isolasi Direktori di Root (`e2e/`):**
   - Seluruh test skenario browser ditempatkan di root direktori `e2e/` (misal: `e2e/auth-personas.spec.ts`, `e2e/bpm-canvas.spec.ts`) dengan file konfigurasi terdedikasi `playwright.config.ts`.
   - Terpisah total dari suite Vitest di `src/**/__tests__` agar tidak ada interferensi runner maupun konfigurasi jest-dom/pool.
3. **Pemisahan Peran CI (`verify.yml`) vs Server Deploy (`deploy.sh`):**
   - **CI Pipeline (`.github/workflows/verify.yml`):** Menjadi gerbang utama (*gatekeeper*). Job E2E Playwright dieksekusi di CI pada setiap Pull Request dan push ke `main`.
   - **Production Deploy Script (`deploy.sh`):** Tetap ramping, deterministik, dan tanpa browser execution. `deploy.sh` hanya berfokus pada sinkronisasi git, migrasi skema database (`drizzle-kit push`), build aset, live rsync, reload PM2, dan health check HTTP ringan (`curl /api/settings`).
4. **Strategi Mocking / WebServer Ringan:**
   - Playwright webServer menggunakan server Vite lokal dengan in-memory/mock state terisolasi (`demo-e2e-seed`), meminimalkan ketergantungan pada service database eksternal di CI sehingga eksekusi cepat (<2 menit) dan deterministik.

## Consequences

- **Positif:**
  - Menjamin interaksi visual dan kanvas BPM (Lampiran 3) teruji di browser nyata sebelum merge ke `main`.
  - Proses deployment di server VPS tetap cepat, hemat memori, dan tidak membebani PM2 dengan headless browser binaries.
- **Konsekuensi Operasional:**
  - Menambah step instalasi browser Playwright (`npx playwright install --with-deps chromium`) di GitHub Actions runner.
  - Memerlukan maintenance selector E2E menggunakan role/label semantik yang stabil (Accessible name / data-testid).
