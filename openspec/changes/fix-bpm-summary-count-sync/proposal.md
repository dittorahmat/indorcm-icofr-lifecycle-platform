## Why

Ditemukan ketidaksinkronan data antara jumlah Risk & Control di halaman summary `/bpm` dengan data yang sebenarnya ada di diagram. Hal ini disebabkan oleh logic pembersihan (*cleanup*) di backend yang hanya menghapus mapping jika risiko tersebut "dimiliki" oleh diagram, sehingga mapping lama dari risiko library/copy tetap tersimpan dan menyebabkan angka summary (riskCount/controlCount) membengkak atau tidak akurat.

## What Changes

- Perbaikan logic sinkronisasi relasi Risk-Control pada route `PUT /api/bpm-diagrams/:id` di backend agar diagram bertindak sebagai *Source of Truth*.
- Implementasi logic pembersihan mapping `rcm_controls` yang berbasis pada relasi aktif yang dikirim dari UI, tanpa memandang kepemilikan (*ownership*) risiko.
- Penyediaan script reparasi data untuk membersihkan mapping "hantu" (*ghost mappings*) dan mensinkronkan ulang angka summary pada database existing.

## Capabilities

### New Capabilities
- `bpm-summary-repair`: Kemampuan untuk melakukan perbaikan data summary Risk & Control secara manual via script jika terjadi ketidaksinkronan masif pada database.

### Modified Capabilities
- `bpm-rcm-integration`: Mengubah logic sinkronisasi dari "Ownership-based Cleanup" menjadi "Canvas-state Cleanup" untuk memastikan integritas data relasional antara BPM dan RCM.

## Impact

- **Backend API**: Perubahan logic pada `worker/user-routes.ts` dalam menangani persistensi diagram.
- **Database Integrity**: Pembersihan tabel `rcm_controls` dari mapping yang sudah tidak relevan dengan visual diagram.
- **Frontend UX**: Angka summary pada tabel utama `/bpm` akan selalu akurat dan sesuai dengan apa yang terlihat di editor visual.
