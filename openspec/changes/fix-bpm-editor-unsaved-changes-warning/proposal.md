## Why

Ketika pengguna mengedit diagram BPM (menambahkan node, shape, atau menggeser elemen) dan kemudian menutup modal editor BPM, sistem tidak menampilkan peringatan adanya perubahan yang belum disimpan (*unsaved changes*). Hal ini menyebabkan risiko kehilangan data pekerjaan pengguna karena perubahan dibuang tanpa konfirmasi.

## What Changes

- Menambahkan pengecekan status perubahan (*dirty state*) sebelum menutup modal editor BPM (`BPMEditor`) di halaman `BPMPage` dan komponen `BPMWorksheet`.
- Menampilkan dialog konfirmasi jika pengguna mencoba menutup modal editor BPM ketika ada perubahan yang belum disimpan.
- Mencegah perubahan parameter pencarian URL (*search parameters*) `diagramId` jika pengguna memilih untuk membatalkan penutupan modal.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `unsaved-changes-guard`: Memastikan penutupan modal editor BPM secara internal (baik melalui tombol "X" maupun klik di luar dialog/escape) terdeteksi dan dicegah jika terdapat perubahan yang belum disimpan.

## Impact

- `src/pages/bpm/hooks/useBPMPage.ts` (modifikasi fungsi penutupan untuk memeriksa `isDirty`)
- `src/components/bpm/BPMWorksheet.tsx` (modifikasi fungsi penutupan untuk memeriksa `isDirty`)
