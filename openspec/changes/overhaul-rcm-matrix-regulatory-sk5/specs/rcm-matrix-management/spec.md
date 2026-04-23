# Spec: RCM Matrix Management

## Overview
Pengelolaan matriks Risk-Control yang terintegrasi dengan konteks proses bisnis sesuai Lampiran 5 b Regulasi SK-5.

## Requirements
- Menampilkan data relasi secara hirarkis: `GL Row` -> `BPM Process` -> `Risk` -> `Control`.
- Sinkronisasi otomatis baris matriks berdasarkan diagram alir BPM.
- Fitur inline editing untuk metadata relasi.
- Penyimpanan persisten untuk kolom-kolom regulasi SK-5.
- Dukungan lokalisasi untuk seluruh label kolom teknis.

## Interface
- Tabel dengan kolom tetap (sticky) untuk info Proses & Risiko.
- Inline input/select pada kolom:
  - IPO (C, A, V, RA)
  - Asersi (E, C, A, CO, VA, RO, PD)
  - Nature & Frekuensi
  - Supporting App & Executor
