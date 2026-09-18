## Purpose

Menstandarisasi representasi geometris dan konektivitas elemen diagram alir proses (BPM) sehingga dimensi node dan swimlane seragam 100% antara penambahan manual dan ekstraksi OCR, serta menjamin keutuhan dan orientasi panah penghubung.

## ADDED Requirements

### Requirement: Uniform Dimensions Between Manual and OCR Elements
Sistem SHALL menggunakan basis dimensi standar yang identik bagi seluruh tipe node dan swimlane, baik saat dimasukkan secara manual dari toolbar kanvas maupun saat diimpor dari dokumen gambar (OCR).

#### Scenario: Dragging manual node matches OCR node scale
- **WHEN** pengguna menambahkan node aktivitas secara manual ke dalam kanvas yang sudah memiliki node hasil ekstraksi OCR
- **THEN** lebar dasar dan tinggi dasar node aktivitas baru tersebut sama persis (160px x 56px pada skala 100%) dengan node hasil OCR tanpa selisih skala

#### Scenario: Swimlane standard default dimensions
- **WHEN** swimlane ditambahkan secara manual atau dibuat oleh tata letak OCR
- **THEN** dimensi default swimlane menggunakan standar lebar seragam (minimum 400px atau lebar setara antar-kolom) dan tinggi yang seragam

---

### Requirement: Swimlane Width Equalization in OCR
Sistem SHALL menyelaraskan lebar seluruh kolom swimlane hasil impor OCR menjadi seragam dan cukup luas untuk menampung seluruh node di dalamnya tanpa membuat kanvas tampak sesak.

#### Scenario: Equalizing lane widths during OCR application
- **WHEN** diagram hasil OCR yang memiliki jumlah node bervariasi pada setiap swimlane diterapkan ke kanvas
- **THEN** sistem menghitung lebar maksimum yang dibutuhkan oleh swimlane terpadat dan menerapkan lebar yang sama ke semua swimlane dalam diagram tersebut

---

### Requirement: Correct Arrow Orientation and Head Visibility
Sistem SHALL memastikan garis panah orthogonal (`BridgeEdge`) selalu mengarah dengan benar sesuai titik handle asal/tujuan dan ujung panah (`markerEnd`) tidak tertutup oleh badan node.

#### Scenario: Edge connecting consecutive vertical nodes
- **WHEN** sebuah edge menghubungkan node atas (source) ke node bawah (target)
- **THEN** titik keluar berada di sisi bawah node atas dan titik masuk berada di sisi atas node bawah, dengan kepala panah mengarah lurus ke bawah tanpa membalik arah

#### Scenario: Arrow head visibility at target node boundary
- **WHEN** garis panah menyentuh batas tepi node target
- **THEN** kepala panah SVG terlihat utuh di luar batas luar node tanpa tertimpa latar belakang node target
