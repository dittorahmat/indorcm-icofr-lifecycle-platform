## Purpose

Memastikan keandalan penyimpanan diagram BPM di lingkungan Cloudflare Workers dan serverless database, dengan penanganan error non-JSON yang elegan pada API client serta pemrosesan batching database yang tahan terhadap batas timeout.

## ADDED Requirements

### Requirement: Client-Side API Non-JSON Error Handling
Klien API `api<T>` SHALL memvalidasi header `Content-Type` sebelum membaca atau mem-parse respons server, dan TIDAK BOLEH crash dengan error parsing JSON jika server mengembalikan halaman HTML atau teks.

#### Scenario: Server returns HTML error page (Cloudflare Timeout / 502 / 524)
- **WHEN** server atau proxy mengembalikan status error dengan Content-Type `text/html` (misal 524 Timeout atau 401 Unauthorized)
- **THEN** fungsi `api` melempar Error yang memuat kode status HTTP dan pesan deskriptif ramah pengguna alih-alih melempar sintaks error JSON.

### Requirement: BPM Payload Sanitization
Editor diagram BPM SHALL mensterilkan array `nodes` dan `edges` sebelum dikirimkan ke endpoint penyimpanan, menghapus referensi fungsi callback dan field non-serializable.

#### Scenario: User saves diagram with complex OCR or custom node handlers
- **WHEN** user menekan tombol simpan diagram setelah impor OCR
- **THEN** payload yang dikirim ke `PUT /api/bpm-diagrams/:id` hanya memuat atribut serializable (id, type, position, data inti) tanpa closures atau event handlers.

### Requirement: Batch Synchronization of Diagram Entities
Backend Worker SHALL melakukan operasi sinkronisasi node, risiko, dan kontrol secara batch, bukan melakukan query per-elemen secara sekuensial.

#### Scenario: Saving diagram with many nodes and swimlanes
- **WHEN** diagram dengan lebih dari 20 node dan relasi disimpan ke server
- **THEN** proses sinkronisasi database selesai dalam waktu kurang dari 2 detik tanpa melampaui timeout Cloudflare Workers.

### Requirement: Resilient Diagram Not Found Handling
Backend Worker SHALL memberikan respons error 404 yang terstruktur jika diagram target tidak ditemukan pada saat pemanggilan `PUT /api/bpm-diagrams/:id`.

#### Scenario: Saving a diagram whose record was deleted after database wipeout
- **WHEN** user mencoba menyimpan diagram yang ID-nya sudah tidak ada di tabel `bpm_diagrams`
- **THEN** server mengembalikan respons JSON 404 dengan pesan yang jelas bahwa diagram tidak ditemukan, dan klien menampilkan notifikasi peringatan yang sesuai.
