# Spec: BPM Editor Modularity

## Capability: bpm-canvas-ux

### Requirement: Modular Sub-components
Sistem penyunting BPM harus memiliki struktur modular di mana setiap bagian visual kanvas terpisah ke dalam sub-komponen terdedikasi tanpa membebani file root editor.

#### Scenario: Canvas Toolbar Extraction
- GIVEN editor BPM aktif
- WHEN pengguna melihat bagian atas kanvas
- THEN `BPMCanvasToolbar` merender tombol alur kerja (Undo, Redo, Auto-Arrange, Zoom Scale, Link GLs, Save Flow) secara mandiri.

#### Scenario: Shape Palette Extraction
- GIVEN editor BPM aktif dan tidak terkunci
- WHEN pengguna membuka palet bentuk di sisi kiri
- THEN `BPMShapePalette` merender seluruh ikon shape standar Lampiran 3 dan daftar kontrol yang belum terpetakan (*Migration Backlog*).

#### Scenario: Selection HUD Extraction
- GIVEN elemen kanvas (Node atau Edge) dipilih oleh pengguna
- WHEN pengguna melihat bagian bawah tengah kanvas
- THEN `BPMSelectionHUD` menampilkan status elemen, jenis badge, toggle lock, dan aksi delete secara reaktif.

#### Scenario: OCR Modal Extraction
- GIVEN pengguna menekan tombol Import OCR
- WHEN dialog modal dibuka
- THEN `BPMOcrModal` mengelola seluruh upload file, rendering preview gambar, kanvas staging, dan tab penyesuaian shape/koneksi secara terisolasi.
