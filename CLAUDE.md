# IndoGRC Pro - ICOFR Lifecycle Platform

## Project Overview
IndoGRC Pro is a production-grade web application designed to digitize the ICOFR (Internal Control over Financial Reporting) lifecycle for State-Owned Enterprises (BUMN). It is fully aligned with **Regulation SK-5/DKU.MBU/11/2024**, providing a standardized, transparent, and auditable platform for the mandatory 5-step ICOFR process.

## Technology Stack
- **Frontend**: React 18+ (Vite), TypeScript, TanStack Query, Zustand, React Flow, Tailwind CSS, Shadcn/UI
- **Backend**: Cloudflare Workers / Node.js, Hono, PostgreSQL, Drizzle ORM

## Mandat Penyelesaian Tahap (CRITICAL)

Setiap kali menyelesaikan sebuah fitur, perbaikan bug, atau fase pengembangan, Anda **WAJIB** menjalankan urutan validasi berikut tanpa perlu diminta kembali oleh pengguna:

1.  **Sinkronisasi Skema Database:** Jika ada perubahan pada `worker/db/schema.ts`, jalankan `npx drizzle-kit push` untuk menerapkan perubahan ke database PostgreSQL secara langsung.
2.  **Lokalisasi Penuh (i18n):** Periksa seluruh file yang dimodifikasi. Pastikan **TIDAK ADA** teks hardcoded (Inggris maupun Indonesia). Gunakan `useTranslation` dan file di `src/i18n/locales/**`.
3.  **Integritas Tipe:** Jalankan `npm run type-check`. Perbaiki semua error TS sebelum melangkah maju.
4.  **Standar Kode (Lint):** Jalankan `npm run lint`. Pastikan tidak ada peringatan atau error yang tersisa.
5.  **Verifikasi Kompilasi (Build):** Jalankan `npm run build`. Perubahan dianggap gagal jika proses build tidak berhasil.
6.  **Pengujian Otomatis (Test):** Jalankan `npm test`. Tambahkan unit test baru jika Anda menambahkan fitur baru atau melakukan perubahan di suatu fitur untuk mencegah regresi.

## Development Conventions
*   **Regulatory Compliance:** Any UI or data model change MUST refer to Regulation SK-5/DKU.MBU/11/2024.
*   **Type Safety:** Shared types in `shared/types.ts` are the source of truth.
*   **Auditability:** Every entity mutation should be accompanied by an entry in the `auditTrail` and `ChangeLog`.
*   **Design Quality & Accessibility:** Minimum font size is 12px (text-xs). Use Shadcn/UI Design Tokens (--primary, --sidebar, etc.) instead of hardcoded hex colors.
*   **Data Persistence:** Always run drizzle migrations using `npx drizzle-kit push` after schema changes.
*   **Localization:** All UI strings MUST be localized using `src/i18n/**`.
