# Design: Remaining Codebase LOC Compliance Refactoring

## Context
Lihat `proposal.md`. Proyek memiliki file skema `worker/db/schema.ts` (864 LOC) dan komponen `src/components/scoping/GLDataGrid.tsx` (647 LOC). Mandat arsitektur menetapkan batasan keras maksimal 800 LOC dan batas fleksibel 500 LOC per file komponen/service.

## Goals / Non-Goals

**Goals:**
- Memecah `worker/db/schema.ts` menjadi sub-skema modular di `worker/db/schema/` berdasarkan domain fungsional (< 250 LOC per berkas).
- Menjadikan `worker/db/schema.ts` sebagai facade re-export sederhana (< 30 LOC) yang mempertahankan 100% backward compatibility dengan `worker/db/index.ts` dan seluruh routes/services.
- Memastikan `drizzle-kit` tetap mendeteksi schema dengan benar (`drizzle.config.ts` mengarah ke `./worker/db/schema.ts` atau `./worker/db/schema/index.ts`).
- Memecah `GLDataGrid.tsx` menjadi komponen presenter kolom (`GLDataGridColumns.tsx`) dan toolbar (`GLDataGridToolbar.tsx`), menyusutkan container utama ke < 350 LOC.
- Menjamin 0 error pada TypeScript type-check, linting, build, dan automated tests.

**Non-Goals:**
- Mengubah struktur nama tabel, nama kolom, relasi foreign key, tipe data, atau schema name (`icofr`).
- Mengubah fungsionalitas atau tampilan visual dari antarmuka GL Data Grid.
- Mengubah `worker/services/scoping-defaults.ts` yang murni data dictionary konstanta array/object.

## Decisions

### 1. Pola Dekomposisi Skema Database Drizzle
- **Pilihan:** Ekstraksi per domain ke direktori `worker/db/schema/`:
  - `auth.ts`: Auth & identity
  - `gl-scoping.ts`: Financial lines, snapshot GL & materiality
  - `rcm-bpm.ts`: Diagram alir, proses, risiko, dan kontrol
  - `csa-testing.ts`: Sampling pengujian, TOD, TOE
  - `knowledge-soc.ts`: Documents AI, vendor, lisensi, SOC & audit logs
  - `relations.ts`: Seluruh relasi Drizzle ORM
  - `types.ts`: Custom Drizzle types (`tsvector`, `vector`, `ownerAcceptanceEnum`)
- **Alternatif yang Dipertimbangkan:** Membiarkan skema dalam satu file besar karena ORM. *Alasan ditolak:* Menimbulkan risiko merge conflicts besar saat beberapa fitur dikembangkan bersamaan dan melanggar mandat LOC.

### 2. Drizzle Config & Imports Compatibility
- `drizzle.config.ts` memiliki `schema: "./worker/db/schema.ts"`.
- `worker/db/schema.ts` akan bertindak sebagai entrypoint agregator:
  ```typescript
  export * from "./schema/types";
  export * from "./schema/auth";
  export * from "./schema/gl-scoping";
  export * from "./schema/rcm-bpm";
  export * from "./schema/csa-testing";
  export * from "./schema/knowledge-soc";
  export * from "./schema/relations";
  ```
  Hal ini menjamin `drizzle-kit push` dan seluruh impor backend tidak terganggu sama sekali.

### 3. Dekomposisi UI GLDataGrid
- **Pilihan:** Memisahkan definisi kolom (`ColumnDef<GLRow>[]`) dan toolbar filter ke sub-file tersendiri di direktori `src/components/scoping/`.
  - `GLDataGridColumns.tsx`: Mengatur rendering cell untuk FSLI badge, nominal balance, confidence bar, dan actions.
  - `GLDataGridToolbar.tsx`: Mengatur search box, filter kategori, dropdown FSLI, dan export button.
  - `GLDataGrid.tsx`: Menyediakan state container, query, mutation, dan TanStack Table hook.

## Risks / Trade-offs

- **[Circular Dependency antara Relations dan Tables]** → *Mitigasi:* Seluruh `relations()` Drizzle diletakkan terpusat di `worker/db/schema/relations.ts` yang mengimpor tabel dari file domain masing-masing, sehingga tabel domain tidak saling memiliki circular dependency.
- **[Drizzle Kit Schema Parsing Failure]** → *Mitigasi:* Verifikasi langsung menggunakan `npx drizzle-kit generate --dry-run` atau type check untuk memastikan AST Drizzle mengenali seluruh tabel.
- **[GL Data Grid Table Rerenders]** → *Mitigasi:* Callback filter dan columns dibungkus dengan `React.useMemo` dan `React.useCallback`.
