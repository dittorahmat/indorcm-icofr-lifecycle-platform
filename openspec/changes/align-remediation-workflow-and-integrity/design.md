## Context

Saat ini, modul CSA dan Defisiensi bekerja secara asinkron. CSA mencatat temuan "Tidak Efektif", namun tidak memicu pembuatan objek `ActionPlan`. Sementara itu, halaman `DeficiencyBoard` merender kartu berdasarkan `action_plans`. Ketidaksinkronan ini diperparah dengan perbedaan status antara UI Kanban (`Draft`, `In Progress`, dsb.) dengan state machine formal di `WorkflowPanel` (`Ineffective`, `In Review`, dsb.).

## Goals / Non-Goals

**Goals:**
- Menjamin integrasi data 1:1 antara temuan `Ineffective` CSA dengan `ActionPlan`.
- Menyamakan terminologi dan state status di seluruh platform (Backend & Frontend).
- Meningkatkan proteksi data input melalui mekanisme Unsaved Changes.
- Menstandarisasi UI tombol aksi pada Kanban Board.

**Non-Goals:**
- Mengubah alur kalkulasi matematis DoD (hanya mengubah state flow).
- Melakukan migrasi data masal untuk data legacy (fokus pada data baru & sedang berjalan).

## Decisions

### 1. Atomic Deficiency-ActionPlan Creation
- **Rationale**: Menghindari data "nyangkut" atau defisiensi yang tidak terurus.
- **Implementation**: Di `worker/routes/csa.ts`, bungkus proses pembuatan `deficiencies` dan `action_plans` dalam satu logika sequential (simulasi transaksi). Status awal diset ke `Ineffective`.

### 2. Kanban Board Alignment
- **Rationale**: UX yang konsisten dengan detail form.
- **Implementation**: Ubah `KANBAN_COLUMNS` di `DeficiencyBoard.tsx`. Implementasikan `onStatusChange` menggunakan fungsi `executeAction` dari hook `useWorkflow`.

### 3. Centralized Workflow Handler
- **Rationale**: DRY principle.
- **Implementation**: Gunakan rute `/api/actionplans/:id/workflow` untuk semua perpindahan kolom di Kanban, sehingga audit trail (history) tetap tercatat.

### 4. Unsaved Changes Integration
- **Rationale**: Mencegah kehilangan data pada form yang kompleks (Remediasi).
- **Implementation**: Gunakan hook `useUnsavedChanges` pada `RemediationForm.tsx` dan pastikan props `isDirty` dipantau oleh `WorkflowPanel`.

## Risks / Trade-offs

- [Risk] Perubahan status kolom Kanban bisa membingungkan user lama. → Mitigation: Update `USAGE_GUIDE.md` dan gunakan tooltip informasi.
- [Risk] Transaksi non-DB (Cloudflare Worker) bisa gagal di tengah jalan. → Mitigation: Implementasikan error handling yang robust dan rollback state jika diperlukan.
- [Risk] Notification bell yang terlalu berisik. → Mitigation: Hanya kirim notifikasi saat state berubah ke "In Review" atau "In Approval".
