## 1. Auto-Layout Engine

- [x] 1.1 Buat util `layoutOcrDiagram()` (urut lane by median-x AI, BFS depth per lane, petak grid, lane min 400px + tinggi seragam) dan verifikasi dengan unit test memakai fixtures 4-lane/13-node meniru BPM KUR (tidak ada overlap, urutan lane benar)
- [x] 1.2 Tambahkan validasi respons OCR (drop edge yatim dengan warning, flag node tanpa label, clamp dimensi lane) dan verifikasi unit test mencakup tiap kasus invalid

## 2. Prompt Backend

- [x] 2.1 Perketat `systemInstruction` OCR (abaikan kop/footer/badge, ekstrak department/function, wajibkan label edge, koordinat hanya hint) dan verifikasi endpoint mengembalikan skema yang sama via test manual dengan gambar contoh

## 3. Review Dialog Interaktif

- [x] 3.1 Ganti panel kanan dialog menjadi mini-canvas React Flow staging (drag, delete node/edge, reconnect, edit label/tipe) + thumbnail gambar asli dan verifikasi semua interaksi bekerja sebelum Apply
- [x] 3.2 Tambahkan daftar edge dengan rename/delete di dialog dan verifikasi edge yang sulit diklik tetap bisa dihapus lewat daftar
- [x] 3.3 Ubah Apply menjadi overwrite penuh dengan konfirmasi unsaved-changes dan `fitView` setelah Apply, dan verifikasi canvas lama terganti total hanya setelah konfirmasi

## 4. Paritas Node Manual & Edge

- [x] 4.1 Samakan node OCR dengan node manual (`regulatoryPairs`, `role`, lock handler, regenerasi badge, tanpa `extent` menjebak) dan verifikasi property sheet + drag/connect/lock/delete identik dengan node manual
- [x] 4.2 Tambahkan `NodeResizer` pada `SwimlaneNode` dan hit-area tak terlihat pada `BridgeEdge`, dan verifikasi lane bisa di-resize serta edge mudah diseleksi/dihapus via keyboard

## 5. Verifikasi Akhir

- [x] 5.1 Jalankan mandat penyelesaian tahap (`type-check`, `lint`, `build`, `test` + i18n tanpa hardcoded string) dan verifikasi semuanya hijau
- [x] 5.2 Uji end-to-end dengan gambar contoh BPM KUR dan verifikasi 5 poin masukan pengguna terpenuhi (lane besar, panah rapi & terhapus, tanpa overlap, isi/topologi sesuai gambar, interaktif seperti manual)
