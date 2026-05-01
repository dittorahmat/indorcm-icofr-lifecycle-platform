## Why

Model Control Self-Assessment (CSA) saat ini masih berbasis "per kontrol", yang memaksa user melakukan input repetitif untuk setiap sampel di tiap kontrol. Perubahan ini bertujuan untuk mengadopsi model "CSA per Sub-Proses" sesuai masukan operasional (Pak Dodi) dan regulasi SK-5/2024, di mana satu sampel transaksi langsung diverifikasi terhadap seluruh kontrol dalam sub-proses tersebut melalui pusat eksekusi (BPM Modal) dan dipantau melalui dashboard penjadwalan.

## What Changes

- **Todo List Dashboard**: Penambahan menu baru berisi kalender untuk memantau jadwal CSA, tenggat waktu, dan status remediasi (Started/Not Started). Mendukung pembuatan jadwal rutin (Bulanan, Triwulanan, dll).
- **Execution Hub Navigation**: Integrasi tombol akses langsung dari Kalender ke dalam sub-proses hub.
- **BPM Modal Execution Hub**: Transformasi modal sub-proses menjadi hub terintegrasi dengan tab:
    - **Worksheet**: Deskripsi pengendalian (free-text) dan penomoran "No. BPM" yang eksplisit.
    - **Detail Transaksi**: List data GL/Journal untuk pemilihan sampel secara manual via checkbox.
    - **CSA Assessment**: Tabel multi-kontrol terpadu dengan workflow cepat (tanpa blocking gate konfirmasi statis).
    - **Lampiran 5a, 5b, 5c**: View matriks RCM (ELC, TLC, ITGC) yang difilter khusus untuk sub-proses tersebut.
    - **Lampiran 6**: Log perubahan otomatis atas modifikasi worksheet.
- **Zero Tolerance Aggregate Logic**: Jika satu saja kontrol pada satu sampel gagal, status sub-proses otomatis menjadi "Ineffective".
- **Evidence Management**: Validasi jumlah bukti berdasarkan rumus (Jumlah Kontrol x Jumlah Sampel).
- **Database Migration**: Skema baru untuk `csa_schedules` dan refactor `csa_samples` menggunakan JSONB untuk hasil multi-kontrol.

## Capabilities

### New Capabilities
- `csa-lifecycle-scheduling`: Kemampuan untuk melakukan manajemen jadwal CSA berbasis kalender dengan tracking status progres.
- `multi-control-csa-assessment`: Workflow verifikasi multi-kontrol dalam satu baris sampel transaksi di level sub-proses.
- `transactional-sampling-hub`: Integrasi pemilihan baris data transaksi asli (GL/Journal) sebagai basis sampel CSA.

### Modified Capabilities
- `csa-standalone`: Perubahan orientasi dari pengujian kontrol individual ke pengujian agregat sub-proses.
- `bpm-edge-visuals`: Penyesuaian navigasi dari daftar sub-proses untuk membuka Execution Hub terpadu.

## Impact

- **Frontend**: Modifikasi besar pada `BPMPage.tsx`, pembuatan `TodoListPage.tsx`, dan refactor `CSATabContent.tsx`.
- **Components**: Integrasi halaman RCM (5a,b,c) sebagai sub-komponen di dalam modal.
- **Backend**: Penyesuaian API `/api/csa` dan `/api/bpm-processes`.
- **Database**: Migration Drizzle untuk tabel scheduling dan schema samples.
- **I18n**: Update lokalisasi untuk modul Todo List dan template report baru.
- **UX**: Implementasi `UnsavedChangesDialog` pada workflow sampling dan assessment.
