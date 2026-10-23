# BPM Editor & OCR Layout Architecture

Arsitektur modul BPM Editor terbagi secara tegas antara mesin tata letak deterministik murni, manajemen state kanvas React Flow, dan antarmuka penelaahan (review modal):

## 1. Mesin Tata Letak Deterministik (Pure Layout Engine)
- **`src/utils/ocr-layout.ts`**: Orkestrator utama tata letak OCR deterministik (≤200 LOC non-kosong). Memilih mesin, menyusun swimlane, menempatkan node tanpa lane sesuai susunan sumber (blok mana pun yang lebih atas di gambar tetap di atas), dan memilih handle edge. Tidak lagi menghitung rank sendiri.
- **`src/utils/ocr-layout-rows.ts`**: Mesin default *coordinate-anchored*. Mengelompokkan `y` sumber menjadi baris global lintas-swimlane (`clusterRows`), menakar tinggi baris dari kotak render (`buildRowBands`), menghitung lebar lane dari konten, dan menempatkan node sesuai urutan `x` sumber. Lane mengikuti tinggi konten (bukan 1000px tetap).
- **`src/utils/ocr-layout-rank.ts`**: Mesin cadangan (algoritma rank lama, dipertahankan apa adanya). Dipakai otomatis ketika koordinat hasil OCR tidak layak (`hasUsableGeometry`: ≥50% `y` unik, IQR ≥15% rentang, ≥2 baris). Tinggi lane-nya juga mengikuti konten (min 300px), bukan band 1000px kosong.
- **`src/utils/ocr-layout-deoverlap.ts`**: Sapuan deterministik anti-tumpuk (sebar horizontal per baris, dorong vertikal, batas iterasi = jumlah node).
- **`src/utils/ocr-node-box.ts`**: Estimator kotak render (`estimateNodeBox`) — tinggi label yang wrap ikut dihitung, karena registry hanya menyimpan tinggi minimum.
- **`src/utils/ocr-lane-geometry.ts`**: Utilitas geometri murni yang masih dipakai mesin rank:
  - Perhitungan lebar swimlane (`computeLaneWidths`).
  - Penentuan rank topologis lokal vertikal (`buildDepthMap`, `groupNodesByRank`).
  - Staggering sekuensial node dokumen *standalone* (misal: bundle KUR KTP/KK/Surat Usaha) agar tidak bertumpuk pada rank 0.
- **`src/utils/ocr-layout-edges.ts`**: Pemilihan handle (`right/left`, `bottom/top`) dari geometri hasil layout, dipakai kedua mesin.
- **`src/utils/ocr-layout-audit.ts`**: Oracle audit **khusus test** (tanpa pemanggil produksi): verdict overlap, containment lane, tinggi lane, urutan sumber, `upwardEdgeIds`, dan `auditUpwardDrift` (edge yang dinaikkan layout padahal sumbernya turun). Dipakai `src/utils/__tests__/` (membuktikan aturannya bisa gagal) dan `src/test/` (fixture + snapshot respons model).
- **Konvensi test:** unit test modul murni tinggal di `src/utils/__tests__/`; integration/e2e (PDF asli, snapshot respons, oracle) di `src/test/`.
- **Capture sekali, replay offline:** `npm run ocr:probe -- <file.pdf|png> [--out fixtures/ocr/<slug>.ocr.json]` memanggil model satu kali dan mencetak verdict audit; `src/test/ocr-real-snapshot.test.ts` me-replay capture itu di `npm test`. Probe live (`OCR_LIVE=1 src/test/ocr-pdf-e2e.test.ts`) hanya untuk memeriksa apakah model masih mengekstrak gambar, bukan untuk menguji layout — lihat `docs/agents/guardrails.md` §OCR layout.
- **PENTING**: Dilarang menghidupkan kembali auto-layout client-side ad-hoc (`bpm-auto-layout.ts` telah dihapus permanen). Koordinat kanvas yang sudah disimpan oleh pengguna bersifat otoritatif. Keputusan arsitektur: `docs/adr/0010-ocr-layout-coordinate-anchored.md`.

## 2. Kanvas & State Management
- **`src/components/rcm/BPMEditor.tsx`**: Komposisi root untuk BPM Studio.
- **`src/components/rcm/editor/BPMCanvasToolbar.tsx`**: Toolbar responsif dengan pemisahan kluster:
  - Kluster Kiri (`flex-1 min-w-0 overflow-x-auto`): Alat bantu (Undo, Redo, Fit, Zoom, Link GLs).
  - Kluster Kanan (`shrink-0 border-l border-slate-200`): Status Locked & Tombol Save Workflow (selalu terlihat).
- **`src/components/rcm/editor/hooks/`**:
  - `useBPMEditor.ts`: Seam orkestrasi tunggal hook editor.
  - `useBPMEditorHistory.ts`: Pengendali Undo, Redo, dan shortcut keyboard (`Ctrl+Z`, `Ctrl+Y`).
  - `useBPMDiagram.ts`: Graph state (nodes & edges) dan mutasi React Flow.

## 3. Penelaahan OCR (Staging & Review)
- **`src/components/rcm/editor/BPMOcrModal.tsx`**: Modal dialog upload dan penelaahan OCR.
- **`src/components/rcm/editor/ocr/OcrReviewView.tsx`**: Tampilan penelaahan berdampingan (*split-view*) yang menyandingkan gambar/PDF sumber asli dengan kanvas staging React Flow sebelum pengguna melakukan *Save & Apply*.
- **`src/components/rcm/editor/ocr/useOcrStaging.ts`**: Pengendali siklus staging OCR (parsing, deduplikasi, validasi peringatan).
