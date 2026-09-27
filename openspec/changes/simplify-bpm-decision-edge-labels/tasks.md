## 1. Diamond Polos (Hapus NO/YES Paten)

- [x] 1.1 Hapus kedua div paten (`NO` merah kiri, `YES` hijau kanan) di `src/components/rcm/nodes/ProcessNodes.tsx:106-107` pada `DecisionNode`, pertahankan keempat `Handle` (`top`/`no`/`yes`/`bottom`) dan styling diamond, lalu verifikasi dengan `npm run type-check`.
- [x] 1.2 Verifikasi tidak ada lagi teks `NO`/`YES` pada decision node di canvas (cek visual EN + ID, termasuk node tanpa koneksi dan node dengan 3 cabang) dan pastikan tidak ada pelanggaran anti-slop baru via `npm run lint`.

## 2. UI Edit Edge Label di Canvas Utama

- [x] 2.1 Tambah key i18n `edge.labelPlaceholder` (`Add label…` / `Tambah label…`) dan `edge.labelHint` (`Click an arrow, then type Ya / Tidak` / `Klik panah, lalu ketik Ya / Tidak`) di `src/i18n/locales/en/bpm.json` dan `src/i18n/locales/id/bpm.json`, lalu verifikasi dengan membuka kedua file dan memastikan tidak ada hardcoded string baru.
- [x] 2.2 Tambahkan input edit label di `src/components/rcm/editor/BPMSelectionHUD.tsx` saat `selectedEdge` aktif (nilai dari `selectedEdge.label`, `maxLength` ~24, disabled saat `isLocked`, commit on blur/Enter), terima prop baru `onUpdateEdgeLabel(edgeId, label)`, dan verifikasi dengan `npm run type-check`.
- [x] 2.3 Implementasikan `onUpdateEdgeLabel` di `src/components/rcm/BPMEditor.tsx` (`pushState` saat commit + `setEdges` update `label` + `setDirty(true)`), wire ke `BPMSelectionHUD`, dan verifikasi undo/redo + indikator unsaved-changes bekerja manual.

## 3. Regression & Verification

- [x] 3.1 Pastikan edge label lama (`Ya`/`Tidak`) tetap tampil di `BridgeEdge` tanpa perubahan renderer, panah non-cabang dengan label kosong tetap tanpa kotak, dan routing/handle decision (`no`=kiri, `yes`=kanan) tidak berubah — verifikasi manual pada diagram Sampel (mis. Revenue: `MEMENUHI SYARAT?`, `MEMENUHI SPESIFIKASI?`).
- [x] 3.2 Jalankan `npm run build` dan pastikan berhasil tanpa error.
- [x] 3.3 Jalankan `npm test` dan pastikan seluruh suite hijau (atau catat kegagalan pre-existing yang tidak terkait).
- [x] 3.4 Verifikasi visual manual EN + ID: diamond polos tanpa NO/YES, klik panah → ketik `Ya`/`Tidak` → tersimpan + persist setelah save/reload, serta export PDF tetap menampilkan edge label.
