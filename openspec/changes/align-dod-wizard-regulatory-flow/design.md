## Context

`DoDWizard.tsx` saat ini menggunakan state `step` (0-7) untuk mengontrol alur pertanyaan. Namun, transisinya tidak sepenuhnya mencerminkan Gambar 5 dari regulasi SK-5/2024. Selain itu, beberapa jawaban "No" seharusnya memicu terminasi langsung ke "Material Weakness" atau "Control Deficiency" tanpa langkah tambahan, kecuali jika `isAggregate` aktif.

## Goals / Non-Goals

**Goals:**
- Mengimplementasikan state machine yang akurat sesuai Gambar 5 Regulasi SK-5/2024.
- Memastikan transisi Box **e** (Step 5) jawaban **No** langsung menuju **Material Weakness**.
- Melakukan mapping field database `answers` agar mencakup metadata langkah yang diambil untuk audit trail.

**Non-Goals:**
- Mengubah logika perhitungan PM/OM di modul Scoping (hanya mengonsumsi datanya).
- Mengubah skema UI dialog/modal (tetap menggunakan Shadcn/UI Dialog).

## Decisions

- **Decision 1: Refaktor `handleAnswer` Logic**
  - **Option A**: Menggunakan nested `if-else`.
  - **Option B**: Menggunakan objek transisi (State Machine Map).
  - **Rationale**: Memilih **Option A** karena jumlah langkah yang terbatas (7 box) dan untuk menjaga konsistensi dengan pola kode yang sudah ada, namun dengan perbaikan rute transisi yang ketat sesuai regulasi.

- **Decision 2: Mapping Teks i18n**
  - **Rationale**: Memisahkan teks pertanyaan regulasi ke dalam namespace `deficiency` di file JSON `id` dan `en`. Menggunakan kunci `wizard.box1.question`, `wizard.box2.question`, dst. sesuai urutan Gambar 5.

- **Decision 3: Penyimpanan Metadata di Database**
  - **Rationale**: Menambahkan field `flowchart_path` atau memperluas `pre_assessment` (jsonb) pada tabel `deficiencies` untuk menyimpan urutan jawaban User. Ini penting agar auditor tahu *bagaimana* sebuah defisiensi diklasifikasikan sebagai MW/SD/CD.

## Risks / Trade-offs

- **Risk**: Perubahan alur mungkin membingungkan user yang sudah terbiasa dengan wizard lama.
  - **Mitigation**: Menambahkan label visual "Box X" pada footer wizard untuk memberikan referensi langsung ke Gambar 5 di buku regulasi.
- **Risk**: Migrasi database pada Cloudflare D1/Postgres bisa gagal jika ada data yang tidak kompatibel.
  - **Mitigation**: Pastikan migrasi Drizzle bersifat non-breaking (add columns instead of renaming).
