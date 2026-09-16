## Why

Saat ini di modul BPM (`BPMPage.tsx`), taksonomi proses masih bersifat datar (*flat list*) di bawah FSLI dan GL Account. Hal ini menyebabkan ketidaksesuaian dengan taksonomi standar ICOFR SK-5/DKU.MBU/11/2024 yang mewajibkan struktur berjenjang: **FSLI ──▶ GL ──▶ Proses Bisnis (Makro) ──▶ Sub-Proses (Mikro) ──▶ Risiko & Kontrol (RCM)**.

Akibat struktur datar sebelumnya, pengguna terlanjur membuat entitas proses secara sejajar (misal: 5 proses mandiri padahal seharusnya 1 proses induk dengan 4 sub-proses). Selain itu, belum ada pemisahan representasi antara diagram makro (*end-to-end business flow*) pada level proses dan diagram mikro/detail BPMN pada level sub-proses, serta belum ada mekanisme reorganisasi/migrasi hierarki dua arah (*promote* / *demote*). Perubahan ini diperlukan agar platform menyajikan tampilan berjenjang yang *expandable* layaknya di `ScopingPage` dan menyediakan tombol migrasi hierarki 2 arah secara *batch*.

## What Changes

- **Skema Database & Relasi Berjenjang**:
  - Menambahkan relasi *self-referencing* `parentId` pada tabel `bpm_processes` (`worker/db/schema.ts`) untuk mengaitkan Sub-Proses ke Proses Induknya.
  - Menambahkan klasifikasi tingkatan/level (`level`: `'process' | 'sub_process'`).
  - Menghubungkan diagram makro ke entitas Proses (Parent) dan diagram mikro ke entitas Sub-Proses (Child).
- **Tampilan Antarmuka Expandable (Opsi A)**:
  - Mempertahankan filter atas FSLI dan GL Account yang terintegrasi dengan scoping.
  - Mengubah tabel daftar proses (`BPMDiagramList.tsx`) menjadi hierarki berjenjang (*expandable tree table* dengan chevron collapse/expand).
  - Menampilkan ringkasan agregasi risiko dan kontrol dari sub-proses di baris proses induk.
  - Menyediakan akses terpisah: tombol "Diagram Makro" di level Proses dan tombol "Diagram Mikro" + "Worksheet RCM" di level Sub-Proses.
- **Fitur Batch Reorganisasi / Migrasi 2 Arah (Parent ⇄ Child)**:
  - Checkbox multi-seleksi pada baris tabel dengan aksi floating toolbar: *"Atur Hierarki / Migrasi"*.
  - Dialog migrasi dengan 2 mode operasional:
    - **Demote (Jadikan Sub-Proses)**: Mengubah proses-proses mandiri yang dipilih menjadi sub-proses di bawah satu Proses Induk target.
    - **Promote (Jadikan Proses Mandiri)**: Melepaskan sub-proses yang dipilih dari induknya dan menaikkannya kembali menjadi Proses Induk (root level).
  - API endpoint batch reorganisation `POST /api/bpm-processes/batch-reorganize`.

## Capabilities

### New Capabilities
- `bpm-process-hierarchy`: Pengelolaan taksonomi berjenjang FSLI ──▶ GL ──▶ Proses (Makro) ──▶ Sub-Proses (Mikro), visualisasi tabel *expandable tree*, serta mekanisme migrasi/reorganisasi hierarki dua arah (*batch promote & demote*).

### Modified Capabilities
<!-- None -->

## Impact

- **Database**: Perubahan skema pada tabel `bpm_processes` (`parentId`, `level`) dengan migrasi drizzle push.
- **Backend API (`worker/routes/bpm.ts`, `worker/services/bpm-service.ts`)**:
  - Penyesuaian query `getAllProcesses` untuk menyertakan `parentId`, `level`, dan agregasi metrik.
  - Endpoint baru `POST /api/bpm-processes/batch-reorganize` untuk eksekusi promote/demote dalam transaksi atomik.
- **Frontend Components**:
  - `src/pages/bpm/BPMPage.tsx`
  - `src/pages/bpm/hooks/useBPMPage.ts`
  - `src/components/bpm/BPMDiagramList.tsx`
  - Komponen baru dialog batch migration `src/components/bpm/BPMMigrationModal.tsx`
- **Tipe Data (`shared/types.ts`)**: Update tipe `BPMProcess` dengan field opsional `parentId` dan `level`.
- **Lokalisasi (`src/i18n/locales/en/bpm.json`, `src/i18n/locales/id/bpm.json`)**: Penambahan kamus i18n untuk hierarki, macro/micro diagram, dan modal migrasi.
