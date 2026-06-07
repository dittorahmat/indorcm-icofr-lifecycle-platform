## Context

`BPMModal` berfungsi sebagai pusat eksekusi untuk proses bisnis di platform IndoGRC. Navigasi tab saat ini tidak mencerminkan alur kerja operasional (ICOFR Lifecycle). Selain itu, desain pengujian (Verification Design) bersifat global dan tidak terintegrasi di dalam modal, sehingga pengguna kehilangan konteks saat ingin melihat rancangan verifikasi untuk kontrol tertentu.

## Goals / Non-Goals

**Goals:**
- Mengatur ulang urutan tab `BPMModal` agar sesuai dengan lifecycle: Dokumentasi -> Data -> Referensi -> Asesmen -> Verifikasi -> Log.
- Mengintegrasikan `VerificationDesignPage` ke dalam modal dengan fitur filtering otomatis berbasis `bpmProcessId`.
- Meminimalkan redudansi UI (menghilangkan header aplikasi ganda saat berada di dalam modal).

**Non-Goals:**
- Mengubah skema database untuk `VerificationMatrix`.
- Mengubah logika bisnis validasi di dalam `VerificationDesignPage`.

## Decisions

### 1. Refactor VerificationDesignPage untuk Reusability
**Keputusan:** Menambahkan props `embedded?: boolean` dan `filterBpmId?: string` pada `VerificationDesignPage`.
**Rasional:** Pendekatan ini memungkinkan komponen yang sama digunakan sebagai halaman mandiri (Full Page) maupun sebagai bagian dari modal (Embedded). Jika `embedded` aktif, `AppLayout` dan `RCMPageHeader` akan disembunyikan atau disesuaikan.

### 2. Scoped Data Fetching
**Keputusan:** Memperbarui parameter `useQuery` pada `VerificationDesignPage` untuk menyertakan `filterBpmId` dalam query key dan sebagai query parameter pada pemanggilan API.
**Rasional:** Memastikan data yang dimuat hanya yang relevan dengan BPM yang sedang dibuka di modal, meningkatkan performa dan akurasi informasi.

### 3. Urutan Tab Logis
**Urutan:** `worksheet`, `sampling`, `rcm`, `csa`, `verification`, `logs`.
**Rasional:** 
1. `worksheet`: Dokumentasi dasar.
2. `sampling`: Penyiapan data uji.
3. `rcm`: Referensi kontrol (TLC/ELC/ITGC).
4. `csa`: Eksekusi asesmen.
5. `verification`: Detail rancangan pengujian (Verification Design).
6. `logs`: Audit trail.

## Risks / Trade-offs

- **[Risk]** Komponen `VerificationDesignPage` sangat lebar (~4200px min-width).
  → **Mitigation:** Gunakan container dengan `overflow-auto` di dalam tab modal untuk mendukung horizontal scrolling secara mandiri tanpa merusak layout modal.
- **[Risk]** API `/api/rcm-matrix/verification-design` mungkin belum mendukung filter `bpmId` di backend.
  → **Mitigation:** Jika backend belum mendukung filter, filtering akan dilakukan di sisi client (Client-side filtering) sebagai fallback cepat, namun prioritas tetap pada implementasi query param di API call.
