## Purpose

Menyediakan kapabilitas antarmuka pengguna interaktif pada BPM Editor yang mencakup riwayat aksi Undo/Redo diskrit, High-Contrast Selection HUD, independent resizing untuk swimlane, serta kemampuan Auto-Arrange topologis instan untuk merapikan elemen proses dan koneksi secara otomatis.

## ADDED Requirements

### Requirement: Undo and Redo Diskrit
Sistem SHALL menyediakan kemampuan membatalkan (undo) dan mengulang (redo) perubahan diagram BPM berbasis aksi pengguna diskrit hingga maksimum 30 snapshot.

#### Scenario: Undo node or swimlane movement on drag stop
- **WHEN** pengguna selesai menggeser satu atau lebih node atau swimlane dan melepaskan mouse (`onNodeDragStop`)
- **THEN** satu entri snapshot disimpan ke dalam riwayat undo, dan saat pengguna menekan `Ctrl+Z` atau tombol Undo, posisi elemen (node maupun swimlane beserta node anaknya) dikembalikan ke posisi sebelum drag dimulai

#### Scenario: Undo node or edge deletion
- **WHEN** pengguna menghapus sebuah elemen (node, swimlane, atau edge)
- **THEN** aksi tersimpan dalam riwayat undo, dan saat Undo dipanggil elemen tersebut dikembalikan lengkap beserta relasi dan datanya

#### Scenario: Undo swimlane resize
- **WHEN** pengguna selesai mengubah ukuran swimlane (panjang/lebar) dan melepaskan handle resize (`onResizeEnd`)
- **THEN** satu entri snapshot disimpan ke dalam riwayat undo, dan saat Undo dipanggil ukuran swimlane dikembalikan ke ukuran sebelumnya

#### Scenario: Undo swimlane data modification
- **WHEN** pengguna mengubah nama departemen atau fungsi pada header swimlane dan keluar dari input (blur)
- **THEN** satu entri snapshot disimpan ke dalam riwayat undo, dan saat Undo dipanggil teks departemen/fungsi dikembalikan ke nilai sebelumnya

#### Scenario: Redo action
- **WHEN** pengguna telah melakukan Undo dan belum melakukan modifikasi baru, lalu menekan `Ctrl+Y` atau tombol Redo
- **THEN** status kanvas dikembalikan ke snapshot aksi sebelum Undo dijalankan

---

### Requirement: Independent Swimlane Stretching
Sistem SHALL mengizinkan peregangan (resizing) swimlane secara independen pada sumbu horizontal (lebar saja) atau vertikal (panjang saja) tanpa memaksa rasio aspek terkunci.

#### Scenario: User stretches swimlane height only
- **WHEN** pengguna menarik handle bawah (bottom edge) pada swimlane yang sedang terpilih
- **THEN** hanya tinggi swimlane yang memanjang ke bawah, sedangkan lebar swimlane tetap tidak berubah

#### Scenario: User stretches swimlane width only
- **WHEN** pengguna menarik handle samping kanan (right edge) pada swimlane yang sedang terpilih
- **THEN** hanya lebar swimlane yang bertambah, sedangkan panjang/tinggi swimlane tetap tidak berubah

---

### Requirement: High-Contrast Selection Awareness
Sistem SHALL memberikan umpan balik visual berkontras tinggi dan jelas mengenai tipe dan identitas elemen kanvas yang sedang aktif dipilih oleh pengguna.

#### Scenario: Node selection highlighting
- **WHEN** pengguna mengklik sebuah node pada kanvas
- **THEN** border node menampilkan ring highlight biru kontras, titik anchor 8-arah menjadi terlihat jelas, dan bilah status seleksi menampilkan nama/label serta tipe node tersebut

#### Scenario: Swimlane selection highlighting
- **WHEN** pengguna mengklik swimlane pada kanvas
- **THEN** batas terluar swimlane menampilkan garis tepi tebal warna indigo dengan indikator floating label dan handle resize yang aktif

#### Scenario: Edge selection highlighting
- **WHEN** pengguna mengklik sebuah garis panah (edge)
- **THEN** garis panah berubah warna menjadi kontras (amber/biru elektrik) dengan ketebalan bertambah dan bilah status seleksi menampilkan sumber dan target panah tersebut

---

### Requirement: Instant Topological Auto-Arrange
Sistem SHALL menyediakan tombol aksi "Auto Arrange" di toolbar kanvas yang merapikan posisi swimlane, node, dan rute panah secara offline dan instan (< 300ms).

#### Scenario: Running auto arrange on mixed diagram
- **WHEN** pengguna menekan tombol "Auto Arrange" di toolbar BPM Editor
- **THEN** sistem mengatur tata letak node secara hierarkis (dari atas ke bawah sesuai urutan ketergantungan proses), menyamakan lebar antar-swimlane secara simetris, dan merapikan rute panah ortogonal tanpa perlu memanggil server eksternal
