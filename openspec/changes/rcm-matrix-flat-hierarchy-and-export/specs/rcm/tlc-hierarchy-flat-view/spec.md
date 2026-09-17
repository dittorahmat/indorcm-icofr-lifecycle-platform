## Purpose

Menyediakan penyajian data matriks RCM TLC dan ITGC secara flat tanpa baris pemisah kelompok biru (`RCMGroupRow`), serta menyelaraskan kolom identitas proses agar merefleksikan Proses Induk (Parent Process) dan Sub-Proses (Child Process) sesuai hierarki taksonomi BPM.

## ADDED Requirements

### Requirement: Flat Matrix Representation
Tabel matriks kontrol pada RCM TLC dan RCM ITGC HARUS disajikan dalam format flat table secara langsung tanpa menyisipkan baris pemisah kelompok proses (`RCMGroupRow`).

#### Scenario: TLC Matrix renders as flat table
- **WHEN** Pengguna membuka halaman RCM TLC Matrix
- **THEN** Seluruh baris kontrol ditampilkan secara berurutan dalam satu tabel datar (flat view) tanpa ada baris pemisah banner biru bertuliskan nomor GL/proses.

#### Scenario: ITGC Matrix renders as flat table
- **WHEN** Pengguna membuka halaman RCM ITGC Matrix
- **THEN** Seluruh baris kontrol ITGC ditampilkan secara berurutan dalam flat view tanpa ada baris pemisah banner biru.

### Requirement: BPM Parent-Child Hierarchy Process Information
Kolom Process Information dan Sub Process pada RCM TLC Matrix HARUS merefleksikan struktur hierarki BPM yang sebenarnya.

#### Scenario: Process Information displays Parent Process
- **WHEN** Pengguna melihat kolom "Process Information" pada baris matriks TLC
- **THEN** Kolom tersebut murni menampilkan nama Proses Induk (Parent Process) dan kode BPM induk (jika ada), tanpa menyertakan awalan nomor GL atau nama FSLI di baris teks yang sama.

#### Scenario: Sub Process displays Child Process Name
- **WHEN** Baris kontrol terkait dengan suatu sub-proses anak
- **THEN** Kolom "Sub Process" menampilkan nama Sub-Proses anak tersebut.

#### Scenario: Standalone/Root Process Mapping
- **WHEN** Baris kontrol terkait dengan proses mandiri/root yang tidak memiliki sub-proses
- **THEN** Kolom "Process Information" menampilkan nama proses tersebut, dan kolom "Sub Process" menampilkan tanda strip `-` atau indikasi root yang konsisten.
