## Requirements Delta

- **ADD**: Sistem harus menyediakan drop-down pilihan skala global (80%, 100%, 120%) pada toolbar atas editor BPMN.
- **ADD**: Pengguna harus dapat mengatur skala node (`nodeScaleOverride`) dan skala font (`fontScaleOverride`) untuk setiap node secara individual melalui panel Regulatory Property Sheet.
- **ADD**: Node harus secara otomatis merespons teks label panjang dengan menurunkan baris teks (word wrapping) dan menyesuaikan tinggi/lebar node secara dinamis agar teks tidak meluber keluar dari batas shape node.
- **ADD**: Skala global dan pilihan override per node harus disimpan di dalam metadata diagram dan tetap utuh saat diagram dimuat ulang dari database.

## Rules Delta

- **ADD** Rule 1.1: Saat skala global diubah, seluruh komponen visual pada kanvas React Flow (node & font teks) harus menyesuaikan ukurannya secara proporsional sesuai persentase yang dipilih.
- **ADD** Rule 1.2: Skala override individu per node harus menimpa (override) aturan skala global yang sedang aktif.
- **ADD** Rule 1.3: Teks di dalam node harus dibungkus dengan benar (`word-wrap: break-word`) dan tidak boleh meluber keluar dari area batas SVG shape node di bawah kondisi skala apapun.
- **ADD** Rule 1.4: Perubahan konfigurasi visual (skala global dan override node) harus menandai halaman sebagai "dirty" (belum disimpan) dan menampilkan peringatan unsaved changes jika pengguna mencoba keluar tanpa menyimpan.

## Interface Delta

Modifikasi Toolbar Atas di BPM Editor:
```
┌────────────────────────────────────────────────────────┐
│  Link GL Codes  [ Linked GLs (0) ]   [Scale: 100% ▼]   │
└────────────────────────────────────────────────────────┘
```

Modifikasi Panel Regulatory Property Sheet (tab Properties):
```
┌────────────────────────────────────────────────────────┐
│ Visual Info                                            │
│  Label                                                 │
│  [ Input Text Label                             ]      │
│  Pelaksana                                             │
│  [ Input Text Pelaksana                         ]      │
│                                                        │
│  Node Scale Override                                   │
│  [ Standard (Default)                        ▼]        │
│                                                        │
│  Font Scale Override                                   │
│  [ Standard (Default)                        ▼]        │
└────────────────────────────────────────────────────────┘
```
