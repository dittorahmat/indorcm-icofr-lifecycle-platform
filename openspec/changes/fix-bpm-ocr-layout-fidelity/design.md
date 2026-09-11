## Context

Pipeline saat ini: `BPMEditor.tsx` (`handleOcrFileChange` → `handleStartOcr` → `handleApplyOcr`, baris 170–319) mengirim base64 ke `POST /api/bpm-diagrams/ocr` (`worker/routes/bpm.ts:96–259`, Gemini via `AIService`), lalu menempel hasil mentah ke React Flow. Design lama (`add-image-to-bpm-ocr/design.md`) menjanjikan koordinat ternormalisasi 0–1000, layout cleaner, dan preview interaktif — dua yang terakhir tidak pernah diimplementasikan. Lihat proposal untuk motivasi.

Konstrain: tidak ada library layout graf (dagre/ELK) di `package.json` — desain ini sengaja menghindari dependensi baru dengan algoritma grid+BFS sendiri yang cukup untuk lane vertikal. `BridgeEdge.tsx` sudah menghitung sisi koneksi dari posisi absolut, sehingga ia menjadi rapi dengan sendirinya begitu overlap hilang.

## Goals / Non-Goals

**Goals:**
- Hilangkan overlap by construction (grid deterministik), bukan dengan memohon ke AI.
- Samakan node/lane OCR dengan node manual dalam perilaku editor.
- Review dialog menjadi staging editor mini yang fully interactive.

**Non-Goals:**
- Tidak menambah endpoint backend baru; tidak mengubah skema DB.
- Tidak mengimplementasikan layout engine umum (horizontal lanes, nested lanes) — hanya lane vertikal seperti contoh KUR dan pola manual saat ini.
- Tidak ada auto-link RCM/risiko ke node OCR (tetap manual via backlog, seperti desain awal).

## Decisions

### Decision 1: AI untuk semantik, frontend untuk geometri (SELECTED)
- **Opsi A (perketat prompt saja)**: minta AI mengembalikan koordinat rapi. Ditolak — AI vision tidak dapat diandalkan untuk geometri presisi; gejala 1–3 akan kambuh pada gambar baru.
- **Opsi B (dagre/ELK)**: layout engine umum. Ditolak untuk iterasi ini — dependensi baru, bundle lebih besar, overkill untuk struktur lane vertikal yang seragam.
- **Opsi C (dipilih)**: AI hanya dipercaya untuk klasifikasi bentuk, label, `parentId`, topologi edge + label edge. Util baru `layoutOcrDiagram()` di frontend: (1) urutkan lane by median-x AI; (2) BFS depth per lane dari entry (node tanpa incoming dalam lane + target edge lintas-lane); (3) petakan ke grid — `x = laneIndex * (LANE_W + GAP_X)`, `y = HEADER_H + depthIndex * (NODE_H + GAP_Y)`; (4) `LANE_W = max(400, maxNodeW + padding)`, tinggi seragam = lane tertinggi. AI `x,y` hanya tiebreak.

### Decision 2: Preview = React Flow mini yang fully interactive
- **Opsi A (daftar teks + tombol hapus)**: perbaikan minimal dialog. Ditolak — tidak menyelesaikan poin 4 (verifikasi visual) dan 5 (interaktivitas).
- **Opsi B (dipilih)**: panel kanan dialog menjadi `<ReactFlow>` instance kedua (nodes/edges state staging terpisah): drag, delete (klik + Delete), reconnect, edit label/tipe, daftar edge dengan rename/delete, thumbnail gambar asli + slider opacity overlay. Apply menyalin state staging ke canvas utama lalu `fitView`. State staging di-dispose saat dialog ditutup tanpa Apply.

### Decision 3: Prompt backend diperketat + validasi respons
- Tambahkan instruksi negatif: abaikan kop/header/footer/tabel versi/tanda tangan dan badge RCM kecil (< ~40px); ekstrak `department`/`function` dari header lane; wajibkan label edge (YES/NO); nyatakan koordinat hanya hint urutan.
- Frontend memvalidasi respons: drop edge dengan `source/target` tak dikenal (kumpulkan sebagai warning di dialog, bukan silent), drop node tanpa label dengan flag, clamp dimensi lane.

### Decision 4: Overwrite penuh dengan guard
- Hapus penggabungan `existingSwimlanes` di `handleApplyOcr`; Apply = `setNodes(stagingNodes)` + `setEdges(stagingEdges)` penuh. Guard: jika `isDirty`, minta konfirmasi eksplisit (ikut pola `useUnsavedChanges`/konfirmasi GL-switch yang sudah ada) sebelum mengganti.

### Decision 5: Hit-area edge tanpa mengubah visual
- `BridgeEdge` me-render path tak terlihat kedua (`strokeWidth: 20, stroke: transparent, pointerEvents: stroke`) di bawah path visual; tidak mengubah tampilan yang diatur `bpm-edge-visuals`. Daftar edge di dialog menjadi jalur hapus kedua.

## Risks / Trade-offs

- **[Risk] AI salah urutan lane** (median-x tertukar) → hasil rapi tapi urutan lane salah. *Mitigasi*: lane bisa di-drag geser di preview sebelum Apply; murah dan menutup risiko.
- **[Risk] AI salah parentId** (node masuk lane tetangga) → node tersusun di lane yang salah. *Mitigasi*: di preview, node bisa di-drag antar lane (update parentId); tampilkan hitung node per lane vs estimasi sebagai sinyal.
- **[Risk] React Flow instance ganda dalam dialog** (perf, id collision). *Mitigasi*: staging state terisolasi dengan id ber-prefix ulang saat Apply; dialog di-lazy-mount hanya saat dibuka.
- **[Trade-off] Posisi tidak meniru gambar asli** — disepakati user (rapikan otomatis menang atas fidelity piksel).
- **[Trade-off] Lane horizontal / miring** di gambar lain tidak didukung layouter ini — fallback: perlakukan sebagai lane vertikal berurutan; catat sebagai limitasi.

## Migration Plan

- Perubahan murni frontend + prompt backend; deploy bersamaan tanpa migrasi data. Diagram yang sudah tersimpan tidak tersentuh (layout hanya berjalan pada hasil OCR baru).
- Rollback: revert commit; endpoint dan skema tidak berubah sehingga aman.

## Open Questions

- Nilai pasti `GAP_X/GAP_Y/HEADER_H` (usulan awal: 16 / 70 / 80) — dapat disetel saat implementasi tanpa mengubah spec.
- Apakah lane perlu `minHeight: 1000` persis seperti manual, atau mengikuti tinggi konten dengan minimum 600? Tidak mengubah spec maupun task breakdown.
