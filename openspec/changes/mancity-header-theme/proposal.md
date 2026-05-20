## Why

Meningkatkan kualitas visual dan profesionalisme UI sesuai dengan standar desain yang diinginkan pengguna dengan mengimplementasikan tema warna Manchester City (Sky Blue) pada elemen header kunci, serta memastikan kontras teks yang optimal (teks gelap di atas latar belakang terang) untuk aksesibilitas yang lebih baik.

## What Changes

- Mengubah warna latar belakang header pada komponen `BPMModal` dari Indigo gelap menjadi biru Manchester City (`#6CABDD`) dengan corak diagonal.
- Mengubah warna teks pada header `BPMModal` menjadi Dark Navy (teks gelap) sesuai variabel `--primary-foreground`.
- Mengubah warna latar belakang baris pemisah (*group row*) pada tabel RCM di `RCMGroupRow` dari Slate gelap menjadi biru Manchester City.
- Mengubah warna teks pada `RCMGroupRow` menjadi Dark Navy untuk kontras yang lebih baik.

## Capabilities

### New Capabilities
- `mancity-theme-ui`: Kemampuan untuk menerapkan tema visual Manchester City pada komponen-komponen UI sistem.

### Modified Capabilities
- Tidak ada.

## Impact

- `src/components/bpm/BPMModal.tsx`: Perubahan styling header dialog.
- `src/components/rcm/RCMGroupRow.tsx`: Perubahan styling baris pemisah tabel.
- Visual konsistensi di seluruh modul RCM dan BPM.
