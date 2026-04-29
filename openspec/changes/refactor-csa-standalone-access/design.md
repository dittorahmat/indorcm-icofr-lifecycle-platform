## Context

Saat ini, `CSATabContent.tsx` adalah komponen yang sangat terikat dengan `BPMModal.tsx`. Props yang diterima (`noGL`, `controls`) bergantung pada data yang di-fetch di level parent (`BPMModal`). Untuk mendukung strategi "Dua Pintu", kita perlu mengubah `CSATabContent` menjadi komponen yang lebih cerdas (smart component) yang bisa menangani fetching datanya sendiri jika diberikan identifier (seperti `controlId` atau `bpmProcessId`), namun tetap fleksibel untuk menerima data via props jika digunakan di dalam konteks lain.

## Goals / Non-Goals

**Goals:**
- Membuat `CSATabContent` menjadi komponen yang reusable baik di Modal maupun di Page.
- Implementasi `CSAModal` untuk akses cepat dari `BPMPage`.
- Implementasi `CSAPage` untuk akses penuh dari Sidebar.
- Menjaga integritas data assessment dengan integrasi `UnsavedChanges`.
- Memisahkan navigasi Worksheet (RCM) dan CSA di `BPMPage`.

**Non-Goals:**
- Merubah logic penilaian/scoring CSA yang sudah ada.
- Menghapus `BPMModal` (Worksheet tetap di sana).

## Decisions

### 1. Unified Component Logic for CSA
**Decision:** Tetap menggunakan `CSATabContent.tsx` sebagai "Single Source of Truth" untuk UI assessment, namun menambahkan filter pencarian/pemilihan control jika digunakan di level Page.
**Rationale:** Menghindari duplikasi logic form assessment yang kompleks (biometrik, sampling, evidence upload).

### 2. URL-Driven State for Standalone Page
**Decision:** `CSAPage` akan menggunakan URL search params (e.g., `?controlId=xxx`) untuk menentukan assessment mana yang sedang aktif.
**Rationale:** Memudahkan deep-linking dan navigasi browser (Back/Forward).

### 3. Navigation Refactor in `BPMPage`
**Decision:** 
- Klik nama Sub-proses -> Buka `CSAModal`.
- Klik icon `Edit` (Action) -> Buka `BPMModal` (Worksheet/RCM).
**Rationale:** Memberikan prioritas akses pada aktivitas yang paling sering dilakukan (assessment) sambil tetap menyediakan akses ke dokumentasi RCM.

### 4. Drizzle Migration for Enhanced Metadata
**Decision:** Menambahkan field `status` dan `lastAssessmentDate` pada tabel `controls` di database (via Drizzle migration).
**Rationale:** Mempercepat loading dashboard CSA Page tanpa harus men-query seluruh riwayat assessment di tabel `csa_records`.

## Risks / Trade-offs

- **[Risk]** Data desync antara Worksheet dan CSA. 
  → **Mitigation**: Pastikan keduanya menggunakan query key TanStack Query yang sama sehingga invalidasi query akan meng-update kedua tampilan.
- **[Risk]** Kehilangan data saat berpindah dari Quick Access (Modal) ke Full Page.
  → **Mitigation**: Implementasi `useUnsavedChanges` hook pada form CSA.
- **[Risk]** User bingung dengan perubahan trigger klik di `BPMPage`.
  → **Mitigation**: Tambahkan tooltip yang jelas pada icon Edit dan nama Sub-proses.
