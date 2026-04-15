## Why

Saat ini, dropdown FSLI di halaman BPM menampilkan seluruh daftar FSLI dari GL Snapshot aktif jika pengguna memiliki peran Admin atau L2, atau jika nilai PM belum ditetapkan. Hal ini menyebabkan ketidakkonsistenan antara hasil Scoping (yang menentukan akun mana yang signifikan) dengan daftar proses yang dapat dipetakan di BPM. Pengguna menginginkan agar BPM hanya menampilkan FSLI yang telah divalidasi sebagai "Significant" di modul Scoping untuk memastikan kepatuhan dan fokus pada area berisiko tinggi.

## What Changes

- **Sinkronisasi Dropdown FSLI**: Mengubah logika filter `significantFsliNames` di `BPMPage.tsx` agar hanya mengambil FSLI yang memiliki akun terkait dalam daftar `significantAccounts` pada simulasi aktif.
- **Penghapusan Admin Bypass**: Menghapus logika yang mengizinkan Admin/L2 untuk melihat seluruh FSLI di dropdown jika simulasi belum lengkap atau PM bernilai 0.
- **Perbaikan Tipe Data**: Menambahkan properti `significantAccounts` ke dalam interface `MaterialitySimulation` di `shared/types.ts` untuk memastikan konsistensi antara data API dan definisi tipe TypeScript.

## Capabilities

### New Capabilities
- `bpm-fsli-filtering`: Kemampuan untuk membatasi pilihan FSLI di BPM berdasarkan hasil final dari proses Scoping.

### Modified Capabilities
- `scoping-data-model`: Penyesuaian model data simulasi untuk menyertakan daftar akun signifikan secara eksplisit dalam tipe `MaterialitySimulation`.

## Impact

- **Frontend**: `src/pages/bpm/BPMPage.tsx` (Logika filter dropdown).
- **Shared Types**: `shared/types.ts` (Update interface `MaterialitySimulation`).
- **User Experience**: Pengguna Admin/L2 tidak akan melihat FSLI non-signifikan lagi di halaman BPM, memaksa alur kerja yang benar (Scoping -> BPM).
