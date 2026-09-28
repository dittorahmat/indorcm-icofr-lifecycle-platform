## 1. Split seleksi vs edit di BPMEditor

- [x] 1.1 Tambah `editingNodeId` + `editingNode` di `src/components/rcm/BPMEditor.tsx`, ubah `RegulatoryPropertySheet` ke `isOpen={!!editingNode}` / `selectedNode={editingNode ?? selectedNode}` dan `onClose` hanya clear `editingNodeId`; verifikasi: single-click tidak membuka dialog pada `npm run dev` manual.
- [x] 1.2 Ubah `onNodeClick` hanya seleksi (skip `risk-control-badge`) dan tambah `onNodeDoubleClick` yang set seleksi + `editingNodeId`; `onPaneClick` clear ketiga state (node/edge/editing); verifikasi: drag/Delete setelah single-click bekerja tanpa dialog, double-click membuka worksheet.
- [x] 1.3 Sinkronkan delete/select-clear dengan state baru (`onNodesDelete`, HUD `onDeleteSelected`, `onClearSelection` juga clear `editingNodeId` bila node yang dihapus sedang diedit); verifikasi: hapus node yang worksheet-nya terbuka menutup dialog tanpa error.

## 2. HUD edit affordance, keyboard, dan i18n

- [x] 2.1 Tambah tombol Edit/Properties + tooltip double-click di `src/components/rcm/editor/BPMSelectionHUD.tsx` via prop `onEditSelected`, sembunyikan untuk `risk-control-badge`; verifikasi: klik tombol membuka worksheet untuk node ter-select di mobile/touch.
- [x] 2.2 Tambah shortcut Enter di `BPMEditor` (guard INPUT/TEXTAREA/contentEditable + saat dialog sudah terbuka) untuk membuka worksheet dari seleksi; verifikasi: Enter membuka sheet, Enter di dalam input label edge tidak membuka sheet.
- [x] 2.3 Tambah keys `bpm:editor.selectionHud.editProperties` + hint di `src/i18n/locales/en/bpm.json` dan `id/bpm.json` tanpa hardcoded string; verifikasi: label/tooltip tampil benar di kedua locale.

## 3. Verifikasi dan QA

- [x] 3.1 Jalankan mandat kualitas (`npm run type-check`, `npm run lint`, `npm run build`, `npm test`) dan perbaiki regresi; verifikasi: semua perintah hijau atau kegagalan pre-existing terdokumentasi.
- [x] 3.2 QA manual + update test yang mengasumsikan single-click membuka dialog (badge diabaikan, swimlane double-untuk-edit, edge tetap inline, tutup sheet pertahankan seleksi, pane-click/Esc clear); verifikasi: seluruh skenario `specs/bpm-node-interaction/spec.md` lolos.
