## Context

Lihat `proposal.md` untuk latar belakang dan motivasi. Saat ini tipe sumber defisiensi di `shared/types.ts` dan schema database mencakup:
- `"Lini 1 - CSA"`
- `"Lini 2 - TOD Review"`
- `"Lini 2 - CSA Validation"` (atau TOE)
- `"Lini 3 - Audit"`

Namun di `src/pages/deficiencies/DeficiencyBoard.tsx`, filter yang disediakan hanya `all`, `lini1`, dan `lini23`. `DeficiencyCard.tsx` juga hanya menggunakan pengecekan sederhana `deficiency.source?.startsWith('Lini 2')`.

## Goals / Non-Goals

**Goals:**
- Menyediakan filter bar segmentasi granular di `DeficiencyBoard.tsx`:
  - `all` (Semua)
  - `csa` (Lini 1 - CSA)
  - `tod` (Lini 2 - TOD Review)
  - `toe` (Lini 2 - CSA Validation / TOE Review)
  - `audit` (Lini 3 - Audit)
- Memberikan visual badge semantik pada `DeficiencyCard.tsx` dengan label, ikon, dan styling institusional sesuai mandat `design-taste-frontend` (tanpa sub-12px font, enterprise border-radius `rounded-md`/`rounded-lg`, kontras tinggi).
- Menjamin kelengkapan i18n di `src/i18n/locales/*/deficiency.json`.
- Menjaga backward compatibility data existing.

**Non-Goals:**
- Merombak skema database utama tabel `deficiencies`.
- Mengubah alur state machine approval workflow (tetap memakai alur Ineffective -> In Review -> In Approval -> Resolved).

## Decisions

### 1. Granular Filter Keys & Filter Logic
- **Decision**: Menggunakan filter key eksplisit:
  - `all`: Semua item
  - `csa`: item dengan `source === 'Lini 1 - CSA'`
  - `tod`: item dengan `source === 'Lini 2 - TOD Review'`
  - `toe`: item dengan `source === 'Lini 2 - CSA Validation'` atau `source === 'Lini 2 - TOE Review'`
  - `audit`: item dengan `source === 'Lini 3 - Audit'`
- **Alternative considered**: Filter dropdown single-select. Ditolak karena filter segmented buttons lebih ergonomis dan memberikan visibilitas instan terhadap pilihan kategori.

### 2. Badge Representation on DeficiencyCard
- **Decision**: Membuat helper visual config untuk mapping setiap source ke label, icon, dan color token:
  - CSA Ineffective: Ikon `ClipboardCheck`, warna `text-blue-700 bg-blue-50 border-blue-200`
  - TOD Review: Ikon `Compass`, warna `text-amber-700 bg-amber-50 border-amber-200`
  - TOE Review: Ikon `FlaskConical`, warna `text-purple-700 bg-purple-50 border-purple-200`
  - Audit: Ikon `ShieldAlert`, warna `text-rose-700 bg-rose-50 border-rose-200`
- **Design Taste Compliance**: Font size minimal `text-xs font-semibold uppercase`, radius institusional `rounded-md`, border solid kontras tinggi.

## Risks / Trade-offs

- **[Risk] Data legacy dengan source kosong / format lama** → **Mitigation**: Berikan fallback default ke `'Lini 1 - CSA'` atau tampilkan label fallback `'Manual / Unspecified'` tanpa menyebabkan crash.
