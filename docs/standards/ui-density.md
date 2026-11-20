# Standar UI Density & Compact Interface BUMN

Dokumen ini merupakan sumber kebenaran teknis (*source of truth*) untuk standar pemadatan antarmuka visual (High Information Density) pada seluruh modul kepatuhan IndoGRC Pro, selaras dengan prinsip Anti-AI Slop dan regulasi SK-5/DKU.MBU/11/2024.

---

## 1. Aturan Densitas Spasi & Kontainer

| Elemen UI | Token Spasi Standar | Keterangan & Batasan |
|---|---|---|
| **Margin Vertikal Halaman / Workbench** | `space-y-4` | Hindari `space-y-6` atau `space-y-8` pada kontainer halaman kerja. |
| **Grid Gap Antar-Kartu Metrik** | `gap-3 sm:gap-3.5` | Ramping dan proporsional untuk tampilan multi-kolom desktop & mobile. |
| **Padding Kontainer Kartu / Banner** | `p-3 sm:p-3.5` atau `p-4` | Maksimal `p-4 sm:p-5` untuk banner eksekutif berlatar terang. |
| **Padding Header Modal Dialog & Sheet** | Minimal `p-4 sm:p-5` | **Dilarang sub-p4** (`p-0` s/d `p-3.5`), ditegakkan mekanis oleh `check:dialog-padding`. |
| **Padding Sel Tabel Data Kepatuhan** | `py-2 px-3` | Berlaku seragam untuk `<TableHead>` dan `<TableCell>` tabel kepatuhan. |
| **Tinggi Input / Trigger Filter Desktop** | `h-8` atau `h-9` | Tetap mempertahankan target sentuh minimal 44px di mobile via `h-11 sm:h-9 min-h-[44px] sm:min-h-0`. |

---

## 2. Batasan Tipografi & Font Anti-Slop

1. **Batas Bawah Font 12px (Mandat Keras):**
   - Dilarang keras menggunakan utility arbitrer ukuran font di bawah 12px (`text-[10px]`, `text-[11px]`).
   - Semua badge, caption, header kolom, sel tabel, dan subscript WAJIB menggunakan minimal `text-xs` (12px) dengan font-weight tegas (`font-semibold` / `font-bold`).
   - Ditegakkan mekanis di pre-commit hook via `scripts/check-font-slop.mjs`.

2. **Dilarang Font Miring (No Decorative Italic):**
   - Teks kepatuhan audit BUMN harus tegas, objektif, dan faktual. Dilarang menggunakan font miring (`italic`) pada data tabel, label regulasi, atau status workflow.

---

## 3. Kelengkapan Lingkup Tiket UI (Exhaustive Scope)

Saat mengerjakan pemadatan densitas berdasarkan tiket spec:
- Agen WAJIB memadatkan seluruh sub-komponen anak (form input pilar, tab pengujian, toolbar filter, kartu Kanban, dan sel tabel) secara tuntas.
- Dilarang hanya memadatkan kontainer orchestrator utama dan melewatkan komponen anak yang disebutkan di spesifikasi tiket.
- Setiap modul baru atau pemadatan densitas visual WAJIB disertai *locking tests* (`*.test.tsx`) yang menguji keberadaan kelas utilitas densitas (`space-y-4`, `py-2 px-3`).
