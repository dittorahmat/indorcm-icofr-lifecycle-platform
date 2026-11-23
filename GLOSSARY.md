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

### Client Paging Slice
Mekanisme pemotongan data array di sisi browser (`items.slice((page - 1) * pageSize, page * pageSize)`) untuk tabel yang telah memuat seluruh dataset via React Query, dilengkapi pengaturan ukuran halaman (10/25/50) dan reset otomatis ke halaman 1 saat kueri pencarian atau filter berubah.
_Avoid_: client pagination ad-hoc

### Density-Preserving Pager
Komponen kontrol paginasi dan selektor baris per halaman yang mematuhi standar desain institusional BUMN: tipografi minimal `text-xs`, tinggi kontrol kompak (`h-8`), namun tetap mempertahankan target sentuh aksesibel minimal 44px pada layar sentuh.
_Avoid_: bulky pagination, oversized pager

### Risk Suggestion
Kandidat deskripsi risiko (`riskDescription`) berbahasa Indonesia yang dihasilkan LLM dari Suggestion Context.
_Avoid_: AI risk, saran risiko (generik)

### Control Suggestion
Kandidat deskripsi pengendalian (`controlDescription`) berbahasa Indonesia yang dihasilkan LLM dari Suggestion Context ditambah Risk terpilih pada pair yang sama.
_Avoid_: AI control

### Suggestion Source
Asal nilai Risk/Control yang dicatat di audit trail: `ai` (LLM), `library` (Risk Library Lampiran 2), atau `manual` (ketikan user).
_Avoid_: AI source (generik)

### AI Response Cache
Cache exact-match app-side untuk jawaban AI per `organizationId`, diikat ke versi Knowledge Base + simulasi Approved aktif agar angka OM/PM tidak basi.
_Avoid_: prompt cache (generik), suggestion cache

### AI Embedding Cache
Pakai ulang vektor embedding untuk teks identik pada chat, retrieval, dan indexing dokumen agar tidak membayar embedding yang sama dua kali.
_Avoid_: vector cache (generik)

### Provider Prompt Cache Adapter
Optimasi opsional di belakang seam `AiCache`: memakai cache prefix bawaan provider (mis. Gemini `cachedContent`) bila tersedia, no-op bila tidak.
_Avoid_: Gemini cache (spesifik-vendor sebagai istilah umum)

### Node Type Registry (Satu Pemilik Tipe Simpul)
Modul data `shared/bpm-node-registry.ts` yang menjadi satu-satunya pemilik identitas tipe simpul BPM: dimensi kanvas + kunci label editor (`bpm:editor.nodes.*`) untuk seluruh 40 anggota `BPMNodeType`. Kolom kanvas (renderer), palette bentuk, pembuatan simpul, dan badge OCR mengonsumsi registry ini alih-alih menyimpan salinan masing-masing. Otorisasi pengecualian YAGNI: `docs/adr/0008-bpm-node-type-registry.md`.
_Avoid_: bpm-node-types sebagai "registry" (itu daftar literal), DEFAULT_NODE_DIMENSIONS (tabel dimensi kedua, sudah dihapus)

### Renderer Parity (Kesejajaran Renderer)
Jaminan kompilasi bahwa setiap anggota `BPMNodeType` punya renderer di peta `bpm-canvas-types.ts` (`satisfies Record<BpmNodeType, unknown>`) dan tidak ada kunci di luarnya. Kunci non-`BpmNodeType` dari diagram lama masuk sebagai `LEGACY_NODE_RENDERERS`, bukan sebagai tipe simpul baru. Cacat yang pernah terjadi: `risk` dan `control` bisa dipersistensikan tanpa renderer sehingga React Flow menggambar simpul default diam-diam.
_Avoid_: "nodeTypes fallback" sebagai perilaku yang dapat diterima

### Canonical Handle Id (Id Handle Kanonik)
Id handle yang benar-benar dirender kanvas (`top-src`, `bottom`, `left-src`, `right`, `bottom-tgt`, `right-tgt`, …) dan satu-satunya yang boleh ditulis oleh kode baru (auto-layout). Tabel sisi `CANONICAL_SOURCE_HANDLES`/`CANONICAL_TARGET_HANDLES` tinggal di `utils/bpm-constants.ts`.
_Avoid_: menulis id lama dari kode baru

### Legacy Handle Alias (Alias Handle Lama)
Id handle yang tersimpan pada diagram hasil build lama dan tidak pernah dirender (`t-c-src`, `b-c-tgt`, `m-r-src`, `m-l-src`) atau id sisi lama (`left` source, `right` target). Boleh dibaca permanen via `canonicalizeHandleId`/`sideFromHandleAlias`; tidak boleh ditulis. Keputusan: tanpa migrasi data.
_Avoid_: melepas tabel alias (diagram lama akan kehilangan sisi koneksi)

### Canvas Hydration (Seam Hidrasi Kanvas)
`src/components/rcm/editor/canvas-hydration.ts`: satu tempat yang mengubah simpul/edge tersimpan atau ter-stage menjadi simpul/edge kanvas hidup — `canvasNodeChrome` (draggable/zIndex/dragHandle), `canvasNodeHandlers` (callback hidup), `hydrateCanvasEdge(s)` + `bridgeEdgeOptions` (gaya edge bridge + perbaikan handle). Tiga pemanggil lama (loader diagram, jalur OCR, document view) menyimpang satu sama lain.
_Avoid_: bridgeEdgeStyle per-modul, `.swimlane-drag-handle` sebagai literal tersebar

### Worksheet Row (Baris Worksheet)
Bentuk baris tunggal `WorksheetRow` (`src/components/bpm/worksheet-row.ts`) yang dibaca kedua renderer worksheet: tabel desktop (lewat accessor react-table atas kolom `Control` yang sama) dan kartu ringkas mobile (lewat `toWorksheetRow`). Pendampingnya adalah `WorksheetRowCommit` — satu seam tulis per-baris (`saveField` debounce, `patch`, `remove`, `openDiagramFor`) yang menggantikan lima objek mutasi yang dulu dioper ke pabrik kolom.
_Avoid_: memilih field baris per-renderer di dalam cell/kartu

### Diagram Projection (Projeksi Diagram Editor)
`src/components/rcm/editor/hooks/bpm-diagram-projection.ts`: proyeksi murni sesi editor — `projectSignatures` (rantai fallback tanda tangan: tersimpan → riwayat workflow → penulis), `comparableDiagramNodes/Edges` (himpunan pembanding `isDirty`), dan `projectDiagramSavePayload` (body `PUT /bpm-diagrams/:id`). Himpunan pembanding `isDirty` adalah keputusan produk dan dikunci test, bukan efek samping refactor.
_Avoid_: merakit ulang blok tanda tangan di dalam hook state

### Dashboard Draft (Cache-as-Truth)
Draft layout dashboard yang **adalah** entry cache React Query `['user-preferences']` itu sendiri: setiap edit ditulis lewat `setQueryData`, dan PUT membaca ulang cache saat tembakan, sehingga body yang dikirim selalu layout yang sedang dilihat user. Kontras dengan mirror server-state (`useQuery` → `useState` + `useEffect`), di mana refetch bisa meninggalkan salinan basi yang menimpa nilai server yang lebih baru saat save berikutnya.
_Avoid_: local state layout, mirror prefs

### Widget Layout Algebra
Aturan murni penempatan grid dashboard (tambah/hapus/patch, `maxPrevY`, lebar per breakpoint, rekonsiliasi payload `onLayoutChange`) yang tinggal di satu modul `src/components/reports/dashboard-layout.ts`; nama yang terlihat user di sana selalu berupa **kunci i18n**, dan judul default tidak pernah ditulis ke data tersimpan sehingga bundle tetap pemilik tunggal kata-katanya.
_Avoid_: layout helper, grid utils

### Regulatory PDF Document Generator
Modul dokumen terisolasi yang mengonversi data kepatuhan (CSA, Lampiran 6, 9, 10, 11) menjadi berkas PDF vektor resmi A4/A3 siap audit sesuai format standar Regulasi SK-5/DKU.MBU/11/2024 (dilengkapi Kop/Header BUMN, penanda Controlled Copy, tabel data berpaginasi rapi, simpulan efektivitas, serta blok tanda tangan digital berjenjang Lini 1 & Lini 2).
_Avoid_: window.print(), browser print screen, tangkapan layar web

### Lampiran 7 Kertas Kerja CSA
Formulir evaluasi pengendalian mandiri Lini 1 standar SK-5 yang mendokumentasikan pengujian atribut kepatuhan (A/B/C/D) berbasis Information Processing Objective (IPO), daftar sampel transaksi, status defisiensi per sampel, dan pengesahan berjenjang.
_Avoid_: form cetak generik
