## Why

Logic penentuan simulasi materialitas aktif di `BPMPage.tsx` saat ini hanya mengambil data terbaru berdasarkan `createdAt` tanpa memedulikan status, sehingga berisiko menarik data dari simulasi yang masih berstatus `Draft`. Selain itu, ditemukan **Data Mismatch** pada modul Scoping di mana detail akun GL disimpan ke dalam field yang seharusnya berisi group FSLI. Hal ini menyebabkan dropdown FSLI di BPM menampilkan nama akun detail (misal: "Kas-Bank") dan bukannya group (misal: "Kas dan Setara Kas"), yang berakibat pada kegagalan filter akun GL di bawahnya.

## What Changes

- **Refine Active Simulation Logic**: Mengubah query `active-simulation` di `BPMPage.tsx` untuk memfilter simulasi dengan status `Approved` saja, kemudian mengambil yang terbaru (`createdAt` terbesar) sebagai baseline resmi.
- **Data Source Correction (Scoping)**: Memperbaiki logic pemetaan di `ScopingPage.tsx` agar menyimpan Nama FSLI dan Kode FSLI yang benar ke dalam array `significantAccounts`, bukan detail GL.
- **Frontend Auto-Healing (BPM)**: Implementasi logic rekonsiliasi data pada `BPMPage.tsx` untuk menangani data simulasi lama yang masih "sakit" dengan melakukan *cross-reference* ke Snapshot GL aktif guna mendapatkan Nama FSLI yang sebenarnya berdasarkan Nomor GL.
- **Strict FSLI Filtering**: Memastikan dropdown FSLI hanya menampilkan item yang secara eksplisit ditandai sebagai signifikan dalam simulasi baseline yang terpilih.
- **Unsaved Changes Warning**: Mengintegrasikan komponen `UnsavedChangesDialog` pada tabel asersi akun di `BPMPage.tsx`.
- **Localization Update**: Memperbarui file lokalisasi untuk mendukung pesan error, label status, dan peringatan unsaved changes.

## Capabilities

### New Capabilities
- `bpm-materiality-baseline`: Mekanisme identifikasi dan penerapan baseline scoping resmi pada modul BPM.
- `scoping-data-integrity`: Perbaikan integritas penyimpanan data scoping level FSLI.

### Modified Capabilities
- `gl-integration`: Sinkronisasi data antara snapshot GL dan scoping yang disahkan untuk ditampilkan di BPM.

## Impact

- **Affected Code**: `src/pages/bpm/BPMPage.tsx`, `src/pages/scoping/ScopingPage.tsx`, `shared/types.ts`.
- **Data**: Memperbaiki kualitas data untuk simulasi di masa depan dan melakukan *healing* pada data lama di level UI.
- **UX**: Dropdown FSLI yang valid dan sinkron dengan detail akun GL di bawahnya.
