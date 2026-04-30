## Context

Halaman BPM saat ini mengambil data simulasi materialitas secara deterministik hanya berdasarkan `createdAt`, dan terdapat ketidakkonsistenan data di mana detail GL (No GL & Deskripsi) disimpan ke dalam field yang diperuntukkan bagi Group FSLI. Hal ini merusak cascading dropdown di halaman BPM.

## Goals / Non-Goals

**Goals:**
- Menjadikan simulasi `Approved` terbaru sebagai baseline resmi.
- Memperbaiki aliran data dari Scoping agar menyimpan identitas FSLI yang benar.
- Mengimplementasikan *Auto-Healing* di frontend BPM untuk menambal data simulasi lama yang sudah terlanjur salah simpan.
- Menambahkan proteksi Unsaved Changes pada asersi akun.

**Non-Goals:**
- Melakukan migrasi database massal secara backend (dipilih pendekatan *healing* via UI untuk meminimalkan risiko kehilangan referensi snapshot).

## Decisions

### 1. Frontend Auto-Healing Logic
Di `BPMPage.tsx`, saat memproses `significantAccounts` dari simulasi aktif, sistem akan mengecek:
- Jika `sa.name` atau `sa.fsliCode` terdeteksi berisi data level GL (misal: `sa.fsliCode` berisi Nomor GL dari snapshot), sistem akan melakukan lookup ke `activeSnap.rows` untuk menarik `fsliName` yang sebenarnya.
- **Rationale**: Menghindari perlunya script migrasi database yang rumit, memberikan perbaikan instan pada data lama tanpa risiko *data corruption*.

### 2. Scoping Storage Correction
Di `ScopingPage.tsx`, array `significantAccounts` akan di-map ulang:
- `name`: diisi `row.fsliName` (BUKAN `row.glDesc`).
- `fsliCode`: diisi `row.fsliCode` (BUKAN `row.noGL`).
- **Rationale**: Memastikan simulasi baru memiliki struktur data yang sehat dan sesuai dengan arsitektur GRC.

### 3. Localization & UX
Menambahkan status banner "Official Baseline" untuk memberikan kepastian kepada Lini 1 mengenai sumber data scoping yang sedang mereka kerjakan.

## Risks / Trade-offs

- **[Risk]** Simulasi lama merujuk pada Snapshot GL yang sudah tidak ada/dihapus → **[Mitigation]** Jika lookup gagal, tampilkan data apa adanya dengan label peringatan atau fallback ke data aslinya.
