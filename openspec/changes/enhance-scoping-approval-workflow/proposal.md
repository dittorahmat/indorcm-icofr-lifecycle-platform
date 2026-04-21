# Proposal: Jira-like Multi-Tier Approval Workflow for Scoping

## Business Case
Berdasarkan SK-5/2024 Tabel 2, penentuan ruang lingkup ICOFR melibatkan banyak pihak. Lini 2 menyusun dan menetapkan hasil awal, CFO (Lini 1) wajib menyetujui, dan Dewan Komisaris melakukan pengawasan/persetujuan akhir. Sistem saat ini hanya memiliki satu langkah persetujuan (Lini 2 -> Komisaris) tanpa peran CFO dan tanpa mekanisme pelacakan riwayat umpan balik (feedback) jika simulasi ditolak. Diperlukan alur kerja bertingkat (Jira-like) untuk transparansi dan kepatuhan.

## Goals
-   **Multi-Tier Workflow:** Menerapkan alur persetujuan: `Draft` -> `Pending CFO` -> `Pending Komut` -> `Approved` (Baseline).
-   **Role Expansion:** Menambahkan role `CFO` secara spesifik ke dalam sistem.
-   **Jira-like History & Feedback:** Setiap aksi (Submit, Approve, Reject) wajib menyertakan catatan (notes) dan dicatat dalam riwayat (history) simulasi, sehingga Lini 2 tahu alasan penolakan.
-   **Notification System:** Menampilkan *badge* notifikasi di sidebar bagi CFO dan Komisaris jika ada simulasi yang menunggu persetujuan mereka.

## Proposed Changes

### 1. Data Model & Roles (`shared/types.ts`)
-   **Roles:** Tambahkan `"CFO"` ke tipe `UserRole`.
-   **Simulation Status:** Perbarui tipe status menjadi: `"Draft" | "Pending CFO" | "Pending Komut" | "Approved" | "Rejected"`.
-   **Approval History:** Tambahkan array objek `history` ke dalam `MaterialitySimulation` untuk menyimpan log aktivitas (aktor, aksi, timestamp, catatan).

### 2. UI/UX Updates
-   **Sidebar Notifikasi:** Tampilkan *unread badge* (angka) di menu "Materiality Approval" untuk role CFO dan Komisaris.
-   **Multi-language Support:** Lokalisasi seluruh status persetujuan baru dan label pada portal approval ke dalam Bahasa Indonesia dan Inggris.
-   **Simulation Editor (ScopingPage):** 
    - Ubah tombol "Submit for Approval" menjadi "Submit to CFO".
    - Tambahkan komponen `ApprovalHistoryTimeline` di bawah halaman untuk menampilkan riwayat komentar (mirip Jira activity tab).
-   **Approval Portal (ApprovalPage):**
    - Sesuaikan query untuk menampilkan data yang relevan sesuai role yang login (CFO melihat "Pending CFO", Komut melihat "Pending Komut").
    - Form *Approve/Reject* yang mewajibkan pengisian catatan (notes).

### 3. API & Database Logic (`worker/user-routes.ts` & `schema.ts`)
-   **Schema Update:** Tambahkan kolom `history` (JSONB) pada tabel `simulations` untuk menyimpan log aktivitas secara permanen.
-   **Endpoint Refactor:** Perbarui endpoint transisi status (`/submit`, `/approve`, `/reject`) untuk mendukung alur bertingkat dan menyisipkan catatan ke dalam array `history`.

## Compliance Alignment
-   **SK-5/2024 Tabel 2:** Memastikan persetujuan CFO (Lini Pertama) sebelum disahkan oleh pengawas (Komisaris).
-   **Transparansi & Akuntabilitas:** Riwayat persetujuan yang tercatat permanen mendukung prinsip GRC.

## Risks & Mitigations
-   **Risk:** Bottleneck jika CFO atau Komisaris lama tidak memberikan persetujuan.
-   **Mitigation:** Status "Pending" yang jelas dan notifikasi visual di sidebar untuk mendorong tindakan.
