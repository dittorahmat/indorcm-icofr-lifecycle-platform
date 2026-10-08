# ADR 0002: YAGNI & Prefer One-Liner Enforcement

## Status
Accepted

## Context
Regulasi internal `AGENTS.md:88` (didupikasikan di `GEMINI.md:88`) mewajibkan YAGNI & prefer one-liner: dilarang abstraksi hipotetis ("nanti mungkin butuh") — hook generik, wrapper, util, opsi config, file/komponen baru sekali-pakai, atau prop/callback tanpa pemakai. Ekstraksi hanya dibenarkan jika (a) dipakai ≥2 tempat, (b) butuh unit test tersendiri, atau (c) memecah god-file `>400 LOC`.

Terjadi ketegangan semu dengan `AGENTS.md:110` (pure-logic extraction): komputasi bisnis wajib modul murni teruji (`aggregate-fsli.ts`, `ocr-shape-badges.ts`, dsb.), yang terlihat bertentangan dengan "inline saja". Glosarium (`GLOSSARY.md`) kini mengunci tiga istilah: `YAGNI-Violation`, `One-Liner`, `Abstraksi Sekali-Pakai`.

Tanpa enforcement yang memblokir, aturan ini advisory dan dilanggar diam-diam (dead util, wrapper sekali-pakai, komentar "future use").

## Decision
1. **Enforcement blocking via proses, bukan AST-detector baru:** checklist PR wajib jawab "pemakai kedua atau test apa yang mengujinya"; andalkan `eslint` (`no-unused-vars/props`) + `npm run check:loc` existing; larangan file `*.ts` one-off di root (wajib `scripts/`). Tanpa detector single-use otomatis (rawan false-positive).
2. **Scope repo-wide:** `src/**/*.{ts,tsx}` + `worker/**/*.ts`, kecuali data-blob (`shared/mock-data.ts`, `shared/constants/**`), vendor (`src/components/ui/**`), test (`*.test.*`), `drizzle/*.sql`.
3. **5 pola violation terkunci:** (i) hook generik sekali-pakai, (ii) wrapper/komponen sekali-pakai, (iii) util/config-option sekali-pakai, (iv) prop/callback tanpa pemakai, (v) komentar "future use / jaga-jaga" + kodenya. Default one-liner: inline expression / early return / `?.` / `.map` langsung.
4. **Grandfather historis, net LOC tidak naik:** delta baru diblokir; kode lama dibersihkan bertahap via Boy Scout Rule, boleh dipangkas jika memungkinkan, dilarang bertambah.
5. **Batas pure-logic menang atas one-liner:** komputasi bisnis (agregasi, mapping, kalkulasi, decision-tree, badge-config) tetap modul murni + test walau sekali-pakai (pengecualian b); one-liner hanya untuk glue UI (render, guard, formatting ringan).

## Consequences
- Abstraksi baru harus membuktikan pemakai kedua atau test pendamping, atau di-inline.
- Logika bisnis tetap teruji di modul murni; glue UI tetap ringkas inline.
- LOC historis tidak naik; lint/LOC gate existing menjadi penegak tanpa tooling baru.
- Rujukan silang: `GLOSSARY.md` (`YAGNI-Violation`, `One-Liner`, `Abstraksi Sekali-Pakai`), `AGENTS.md:88,110`.
