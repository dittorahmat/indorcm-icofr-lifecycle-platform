# Capability Specification: BPM Diagram Edge Routing & Distribution

## Purpose
Spesifikasi ini mengatur kebutuhan visual dan fungsional alur garis konektor (*edges*) pada BPM Diagram Editor agar sesuai dengan standar representasi proses bisnis.

## Requirements

### Requirement 1: Garis Alur Siku (Orthogonal Edges)
- **R1.1**: Seluruh konektor alur secara bawaan (*default*) HARUS ditampilkan menggunakan jalur siku (90-degree orthogonal step paths) menggantikan alur curve/bezier.
- **R1.2**: Pada titik persimpangan antar dua garis siku yang saling bersilangan, komponen HARUS menampilkan visualisasi jembatan (*bridge/hump*) kecil untuk memperjelas alur tanpa saling memotong.

### Requirement 2: Distribusi Port Konektor Tersebar (Distributed Ports)
- **R2.1**: Untuk node dengan sisi rata (seperti Activity, Manual Input, Automated Activity, Document, Data), jika terdapat lebih dari satu edge yang masuk/keluar dari sisi yang sama, titik koneksi HARUS tersebar merata secara horizontal/vertikal di sepanjang sisi tersebut.
- **R2.2**: Urutan posisi penyebaran titik koneksi HARUS disesuaikan dengan posisi relatif node lawan untuk mencegah terjadinya pemotongan/persilangan alur garis (*edge crossing*).

### Requirement 3: Sudut Lancip Terkunci pada Node Decision/Diamond (Fixed Center Anchors)
- **R3.1**: Untuk node berbentuk diamond (Decision) dan node bertitik pusat tunggal (Start, End, Reference, Off-Page Ref), seluruh garis konektor yang masuk/keluar HARUS tetap terkunci (*locked*) tepat pada sudut/titik pusat lancip node.
- **R3.2**: Perhitungan offset port terdistribusi TIDAK BOLEH diterapkan pada node bertipe Diamond/Decision untuk menjaga presisi dan estetika visual flowchart.
