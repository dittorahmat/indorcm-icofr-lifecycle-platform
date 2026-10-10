# ADR 0003: pg_trgm for Substring Search, tsvector Only for Document Corpus

Substring search (`ILIKE '%kata%'` pada `rcms.sub_process`, `bpm_processes.name`, `documents.title`, suffix `rcms.id`) dioptimasi dengan index GIN `gin_trgm_ops` (ekstensi `pg_trgm`), bukan `tsvector`: trigram mempertahankan semantik contains per-substring, sementara `tsvector` stemming akan mengubah hasil (token vs substring). `tsvector` tetap hanya untuk korpus dokumen (`documents`/`document_chunks`, config `indonesian`). Suffix `%-noGL` sengaja tidak di-refactor ke equality-join karena baris id GL-spesifik persisten (`bpm-sync` fan-out) dan join `bpmProcesses` yang null akan menggugurkan hasil — trigram memberi index tanpa mengubah semantik. Non-substring (filter tahun `period`, pemetaan 17 Prinsip COSO) di-refactor ke one-liner logika murni (`LIKE 'YYYY%'` + btree, `getCosoComponent` + GIN containment) tanpa FTS.

## Considered Options

- **tsvector untuk semua kolom teks**: ditolak — stemming `indonesian` memecah kode (`R-BPM-01`) dan mengubah semantik contains menjadi token-match.
- **btree saja**: ditolak — leading `%` tidak sargable di btree; hanya valid untuk prefix (`LIKE 'YYYY%'`).
- **Equality-join untuk suffix noGL**: ditolak — mengubah hasil untuk baris tanpa join dan id GL-spesifik virtual/persisten.

## Consequences

- On-prem/Neon wajib `CREATE EXTENSION pg_trgm` via `scripts/db-extensions.sql` sebelum `drizzle-kit push` (hook di `docker-entrypoint.sh` + `deploy.sh`, migrasi `drizzle/0050_*`).
- Kosakata dikunci di `GLOSSARY.md`: Seq Scan, Trigram Search, Lexeme FTS.
- Drift gate: `npm run db:check` gagal bila `schema.ts` vs `drizzle/meta` tidak sinkron (wajib hijau sebelum push/deploy).

## Validation (2026-10-09, PGlite PG18 + pg_trgm 1.6, C collation, harness di luar repo)

- BEFORE (hanya PK, 12k–120k baris): 5/5 query Seq Scan — masalah terkonfirmasi.
- AFTER `0050` pada kondisi mirip produksi (50 org, wide rows, 120k baris): suffix `LIKE` (BitmapAnd org+trigram), `?` jsonb (GIN, dengan maupun tanpa cast `::jsonb` — hipotesis "cast menghalangi index" TERBUKTI SALAH), 2x `ILIKE` substring (BitmapAnd org+trigram), prefix `LIKE 'YYYY%'` (btree komposit) — 6/7 bentuk query terindex.
- Residual: OR-join `getTlcMatrix` (`r.id LIKE … OR c.fsli_codes ? …` melewati LEFT JOIN) tetap Seq Scan sisi `controls` pada skala stres (243ms @120k). Restructure ke UNION ditolak (YAGNI): tabel `controls`/`rcms` ICOFR nyata berukuran ratusan–ribuan baris per org sehingga biayanya negligible, dan rewrite OR→UNION berisiko regresi di query kepatuhan panas. Opsi masa depan bila terbukti lambat: UNION dua cabang sargable atau index FK `controls.rcm_id`.
- Catatan planner economics: pada tabel sempit + LIMIT kecil, planner BENAR memilih Seq Scan (mis. Q3: 0,6ms seq vs 8,8ms bitmap) — index adalah asuransi skala, bukan kemenangan mutlak. Prefix-`LIKE` memakai btree polos hanya di collation C/C.UTF-8 (Neon, image pgvector, PGlite) — pindah collation lain butuh `text_pattern_ops`.
