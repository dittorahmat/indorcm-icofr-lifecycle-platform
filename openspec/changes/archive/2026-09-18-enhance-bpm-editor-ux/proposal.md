## Why

Proses penyusunan diagram alir bisnis (BPM) pada modul RCM memiliki beberapa hambatan UX yang signifikan:
1. Ketidakkonsistenan ukuran elemen antara hasil ekstraksi OCR dan penambahan manual melalui kanvas (perbedaan lebar/tinggi swimlane dan node 10-20%).
2. Swimlane yang mengalami resize proporsional terkunci (tidak bisa ditarik panjang saja atau lebar saja secara independen).
3. Tidak adanya fungsionalitas Undo/Redo untuk membatalkan kesalahan aksi pengguna secara diskrit (seperti drag, delete, connect).
4. Kurangnya umpan balik visual terhadap elemen yang sedang aktif dipilih (apakah swimlane, node, atau panah/edge) yang memicu salah hapus/edit.
5. Anomali panah/edge (arah panah terbalik atau ujung panah tenggelam tertutup node), khususnya pada diagram hasil OCR.
6. OCR menghasilkan lebar swimlane yang bervariasi dan padat, serta belum tersedianya fitur Auto-Arrange instan untuk merapikan layout diagram secara otomatis.

## What Changes

- **Dimensi Standar & Konsisten**: Menyatukan konstanta dimensi swimlane dan node antara OCR layout (`ocr-layout.ts`) dan manual creation palette di `BPMEditor.tsx` sehingga ukuran selalu seragam 100%.
- **Stretch Swimlane Independen**: Memodifikasi `NodeResizer` pada swimlane agar memungkinkan peregangan bebas horizontal (lebar saja) atau vertikal (panjang saja) melalui handle tepi.
- **Fitur Undo / Redo Diskrit**: Menyediakan riwayat aksi berbasis snapshot state (maksimum 30 langkah diskrit) yang mencakup penambahan/penghapusan elemen, perpindahan node (pada drag stop), dan pembuatan edge, lengkap dengan shortcut `Ctrl+Z` / `Ctrl+Y` serta tombol toolbar.
- **High-Contrast Selection HUD & Highlighting**: Memberikan visual penanda aktif yang kontras dan jelas (border tegas, glow, status bar informasi elemen terpilih) untuk node, swimlane, maupun edge panah.
- **Perbaikan Arah & Visibilitas Panah (BridgeEdge)**: Memberikan explicit handle assignment pada parsing OCR, kalkulasi orientasi handle yang presisi, dan margin/offset kepala panah agar ujung panah (`markerEnd`) tidak tenggelam di bawah kontur node.
- **Equalizer Swimlane OCR & Auto-Arrange Instan**: Menyamakan lebar seluruh kolom swimlane secara cerdas pada saat OCR diterapkan (mengambil dimensi terlebar yang ideal) serta menambahkan tombol "Auto Arrange" berbasis layout topologis hierarkis (offline & instan) di toolbar kanvas.

## Capabilities

### New Capabilities
- `bpm-canvas-ux`: Menyediakan riwayat Undo/Redo diskrit, High-Contrast Selection HUD, independent stretch pada swimlane, dan tombol Auto-Arrange topologis instan.
- `bpm-diagram-standardization`: Standarisasi dimensi node/swimlane yang seragam antara manual drag dan OCR, penyeragaman lebar swimlane OCR, serta perbaikan arah dan visibilitas kepala panah `BridgeEdge`.

### Modified Capabilities
<!-- Tidak ada spesifikasi regulasi sebelumnya yang berubah; ini penambahan fungsionalitas dan UX kanvas -->

## Impact

- **Frontend**:
  - `src/components/rcm/BPMEditor.tsx`: Integrasi history stack Undo/Redo, toolbar button Auto-Arrange & Undo/Redo, Selection HUD.
  - `src/components/rcm/nodes/BPMCustomNodes.tsx`: Penyesuaian `SwimlaneNode` (`NodeResizer` handle setup) dan visual selection state.
  - `src/components/rcm/edges/BridgeEdge.tsx`: Koreksi penentuan orientasi handle dan offset target marker agar panah tidak terbalik atau tenggelam.
  - `src/utils/ocr-layout.ts`: Equalizer lebar swimlane dan pemberian handle eksplisit pada edge hasil OCR.
  - `src/utils/bpm-auto-layout.ts` (baru): Utilitas layout topologis hierarkis offline untuk Auto-Arrange.
  - `src/i18n/locales/**`: Penambahan kunci lokalisasi bahasa untuk tombol Undo, Redo, Auto-Arrange, dan label Selection HUD.
- **Backend / DB**: Tidak ada perubahan skema database karena format penyimpanan JSON node & edge tetap kompatibel ke belakang.
