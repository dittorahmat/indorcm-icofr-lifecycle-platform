# Domain Glossary: IndoGRC Pro ICOFR Lifecycle Platform

## Core Domain Terms

### RCM (Risk and Control Matrix)
Matriks formal kepatuhan ICOFR sesuai Regulasi BUMN SK-5/DKU.MBU/11/2024 yang mendokumentasikan pemetaan antara risiko pelaporan keuangan dengan aktivitas pengendalian internal. Terbagi menjadi tiga tingkatan:
- **TLC (Transaction Level Control)**: Matriks pengendalian tingkat proses transaksi bisnis (Lampiran 5 b), terkait langsung dengan akun signifikan (FSLI) dan langkah-langkah alur operasional pada BPM.
- **ELC (Entity Level Control)**: Matriks pengendalian tingkat entitas yang menguji kepatuhan terhadap 17 Prinsip COSO (Lampiran 5 a).
- **ITGC (IT General Control)**: Matriks pengendalian umum teknologi informasi pendukung sistem pelaporan keuangan (Lampiran 5 c) yang mencakup 4 domain: Manage Access, Manage Program Changes, Manage IT Operations, dan Develop Systems.

### BPM (Business Process Mapping)
Diagram visual pemetaan alur proses bisnis sesuai standar simbol Lampiran 3 SK-5/DKU.MBU/11/2024 (Oval untuk Start/End, Persegi untuk Aktivitas, Belah Ketupat untuk Keputusan, Segitiga Terbalik untuk Arsip, Silinder untuk Sistem/Data Media, Trapesium untuk Operasi Manual, dan Lajur Kolom untuk Swimlane).

### Control Linkage (Tautan Pengendalian)
Relasi eksplisit antara entitas kontrol (`controls`), risiko (`rcms`), dan simpul visual pada diagram proses bisnis (`bpm_node_rcms` dan `node.data.regulatoryPairs`). Memungkinkan auditor atau penguji melihat di langkah alur kerja mana suatu kontrol kunci dijalankan.

### Unmapped Controls
Daftar aktivitas pengendalian yang telah dicatat dalam RCM namun belum ditautkan ke simpul alur spesifik pada diagram BPM. Disediakan dalam panel shape palette kanvas BPM untuk penautan interaktif.

### Auto-Reconciliation / Auto-Link
Mekanisme pencocokan baris kontrol dalam berkas impor RCM terhadap simpul diagram BPM yang ada menggunakan referensi kode simpul (`Ref_Langkah_BPM`) dan kemiripan semantik label teks alur, dilengkapi dialog pratinjau konfirmasi sebelum komit ke basis data.

### YAGNI-Violation (Pelanggaran YAGNI)
Abstraksi yang ditambahkan untuk kebutuhan hipotetis ("nanti mungkin butuh") tanpa pemakai nyata hari ini: hook generik, wrapper, util, opsi config, file/komponen baru yang hanya dipakai sekali, atau prop/callback tanpa pemakai. Dilarang kecuali memenuhi salah satu pengecualian: (a) dipakai ≥2 tempat, (b) butuh unit test tersendiri, atau (c) memecah god-file `>400 LOC`. Keputusan enforcement: `docs/adr/0002-yagni-one-liner-enforcement.md`.

### One-Liner (Solusi Inline Pilihan)
Penyelesaian kasus nyata hari ini dengan satu ekspresi inline tanpa ekstraksi baru: inline expression, early return, optional chaining, `.map` langsung. Pilihan default atas abstraksi baru; dikalahkan oleh pengecualian (b) untuk komputasi bisnis yang wajib tinggal di modul murni teruji.

### Abstraksi Sekali-Pakai (Single-Use Abstraction)
File/fungsi/hook/tipe/komponen baru yang hanya memiliki satu pemakai dan tidak memiliki test pendamping yang menguncinya. Dianggap YAGNI-violation dan wajib di-inline, kecuali untuk memecah god-file `>400 LOC`.

### Seq Scan
Rencana eksekusi Postgres yang membaca seluruh tabel (atau partisi) baris demi baris karena tidak ada index yang dapat melayani predikat query.
_Avoid_: full table scan

### Trigram Search
Pencarian substring/fuzzy case-insensitive (`ILIKE '%kata%'`) yang dipercepat index GIN `gin_trgm_ops` dari ekstensi `pg_trgm`. Pilihan baku untuk kolom nama/judul pendek.
_Avoid_: full text search (generik)

### Lexeme FTS
Pencarian kata berstemming Bahasa Indonesia via kolom `tsvector` + `plainto_tsquery('indonesian', …)` + index GIN (contoh: `documents.fts_tokens`). Hanya untuk korpus dokumen, bukan untuk substring kode/nama.
_Avoid_: full text search (generik)

### AI Suggestion Popover
Popup saran AI yang bisa diklik untuk auto-populate pada Textarea Risk/Control di property sheet simpul BPM.
_Avoid_: tooltip, AI tooltip

### Suggestion Context
Triple konteks pembentuk saran AI: GL (`bpmProcess.noGL`/`currentGL`) + Proses BPM (`bpmProcess.name`/`subProcess`) + Label Node (`node.data.label`).
_Avoid_: GL/BPM/Node (generik)

### Risk Suggestion
Kandidat deskripsi risiko (`riskDescription`) berbahasa Indonesia yang dihasilkan LLM dari Suggestion Context.
_Avoid_: AI risk, saran risiko (generik)

### Control Suggestion
Kandidat deskripsi pengendalian (`controlDescription`) berbahasa Indonesia yang dihasilkan LLM dari Suggestion Context ditambah Risk terpilih pada pair yang sama.
_Avoid_: AI control

### Suggestion Source
Asal nilai Risk/Control yang dicatat di audit trail: `ai` (LLM), `library` (Risk Library Lampiran 2), atau `manual` (ketikan user).
_Avoid_: AI source (generik)
