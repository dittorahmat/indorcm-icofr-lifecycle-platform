## Purpose

Menuntaskan sisa celah mobile pada papan defisiensi dan remediasi agar eksekutif dan Lini 2 dapat memantau status temuan dari ponsel tanpa tabel terjepit atau teks yang melanggar mandat keterbacaan.

## ADDED Requirements

### Requirement: Tipografi papan defisiensi min-12px
Sistem SHALL memastikan tidak ada teks di bawah 12px pada `DeficiencyBoard` di seluruh viewport, termasuk badge penghitung Kanban yang saat ini memakai `text-[10px]`.

#### Scenario: Audit tipografi papan di HP
- **WHEN** papan defisiensi dirender pada viewport 360px
- **THEN** seluruh label, badge, dan penghitung memakai minimal `text-xs` (12px) dengan font-weight tegas, dan grep tidak menemukan `text-[10px]`/`text-[11px]` pada file papan

### Requirement: Kanban menjadi tab vertikal di viewport kecil
Sistem SHALL menyajikan kolom Kanban (mis. Open, In Progress, Resolved) sebagai tab tersegmentasi dengan aliran kartu vertikal per status pada viewport di bawah 768px (`md`), dengan papan Kanban multi-kolom standar tetap dipakai pada `md` ke atas. Kartu SHALL memuat kode defisiensi, proses, tingkat keparahan, pemilik, dan tenggat dalam format terbaca jempol.

#### Scenario: Meninjau temuan di HP
- **WHEN** pengguna membuka papan defisiensi dengan 7 temuan pada viewport 360px
- **THEN** sistem menampilkan pemilih status (tab) dengan jumlah per status, dan kartu vertikal untuk status aktif tanpa scroll horizontal halaman
- **AND** memindahkan status (bila diotorisasi) memakai kontrol selebar jempol, bukan drag-and-drop yang tidak ergonomis di sentuh
