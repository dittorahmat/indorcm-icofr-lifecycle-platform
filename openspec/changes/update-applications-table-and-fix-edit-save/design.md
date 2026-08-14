# Technical Design: Pembaruan Tabel Inventaris Aplikasi & Perbaikan Bug Simpan Data

## 1. Schema & Data Model Changes

### Database Schema (`worker/db/schema.ts`)
```ts
export const applications = pgTable("applications", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull().references(() => organization.id),
	name: text("name").notNull(),
	description: text("description"),
	statusITGC: text("status_itgc"),
	criticality: text("criticality"),
	isSignificant: boolean("is_significant").default(false),
	itgcAreas: jsonb("itgc_areas").$type<string[]>().default([]),
	// New Fields:
	businessOwners: jsonb("business_owners").$type<string[]>().default([]),
	applicationOwners: jsonb("application_owners").$type<string[]>().default([]),
	architectureDocUrl: text("architecture_doc_url"),
	architectureDocName: text("architecture_doc_name"),
});
```

### TypeScript Definition (`shared/types.ts`)
```ts
export type Application = InferSelectModel<typeof schema.applications> & {
  linkedControlCount?: number;
};
```

---

## 2. API Endpoints (`worker/routes/infrastructure.ts`)

1. **`PATCH /api/applications/:id`**:
   - Memperbarui data aplikasi berdasarkan ID dan `organizationId`.
   - Mengubah `name`, `description`, `criticality`, `isSignificant`, `itgcAreas`, `businessOwners`, `applicationOwners`, `architectureDocUrl`, `architectureDocName`.
2. **`POST /api/applications`**:
   - Menerima field baru saat membuat aplikasi baru.
3. **`POST /api/applications/upload-architecture`** (atau handler upload):
   - Menerima file PDF/dokumen arsitektur dan mengembalikan URL & nama file untuk disimpan.

---

## 3. UI Component Changes

### A. `AddApplicationDialog.tsx`
- Menggunakan `useQuery(['departments'])` untuk mengambil daftar departemen terdaftar.
- Menggunakan komponen `MultiSelect` (`src/components/ui/multi-select.tsx`) untuk Business Owner & Application Owner.
- Menambahkan checkbox/switch untuk `ICOFR Scope (Significant)` (`isSignificant`).
- Menambahkan file input / dropzone untuk upload `Application Architecture`.
- Memperbaiki mutation handler saat edit (menggunakan `PATCH /api/applications/:id`).

### B. `SOCMonitoringPage.tsx`
- **Table Header**: `Application Name`, `ICOFR Scope (Y/N)`, `Business Owner`, `Application Owner`, `Application Architecture`, `ITGC Status`, `Criticality`, `Linked Controls`, `ITGC Areas`, `Actions`.
- **Table Row**:
  - Hapus `<Badge>SIGNIFICANT</Badge>` dari kolom `Application Name`.
  - Tambah Cell `ICOFR Scope (Y/N)`: Tampilkan `<Badge variant="outline">Yes</Badge>` jika `app.isSignificant` true, atau `<Badge variant="outline" className="text-slate-400">No</Badge>`.
  - Tambah Cell `Business Owner`: Render badge departemen yang terdaftar.
  - Tambah Cell `Application Owner`: Render badge departemen yang terdaftar.
  - Tambah Cell `Application Architecture`: Render icon file PDF + link ke `architectureDocUrl` (atau text nama file).
