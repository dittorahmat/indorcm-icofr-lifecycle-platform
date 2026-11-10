# Scoping & Materiality Module

Modul ini mengelola siklus penentuan batas materialitas (Overall Materiality / OM dan Performance Materiality / PM) serta matriks scoping akun laporan keuangan (FSLI) sesuai mandat **SK-5/DKU.MBU/11/2024**.

## Lock Decoupling Policy: Mathematical vs Narrative

Untuk mencegah deadlock approval pada simulasi yang membutuhkan justifikasi, sistem membedakan kebijakan penguncian data menjadi dua layer:

| Komponen | Status Draft / Rejected | Status Review (`Pending CFO`, `Pending Komut`) | Status Final (`Approved`, `Pending Deletion`) |
| :--- | :--- | :--- | :--- |
| **Parameter Numerik** (OM %, Haircut %, Basis) | Terbuka (Dapat Diedit) | **Terkunci** (`disabled={isLocked}`) | **Terkunci** (`disabled={isLocked}`) |
| **Teks Justifikasi** (`materialityJustification`) | Terbuka (Dapat Diedit) | **Terbuka** (`isJustificationLocked === false`) | **Terkunci** (`disabled={isLocked}`) |

### Aturan Domain Kunci:
1. **Validasi Wajib di Hulu (`Submit`):** Preparer (Line 1 / Line 2 / Admin) wajib melengkapi justifikasi sebelum tombol `Submit` dapat mengeksekusi transisi status ke `Pending CFO`. Draft otomatis disimpan ke database saat submit.
2. **Reviewer Override:** Jika ada simulasi tanpa justifikasi yang sampai ke meja review, Approver/Admin dapat melengkapi justifikasi secara langsung pada modal tanpa harus me-reject simulasi dan tanpa membuka kunci kalkulasi matematis.
3. **Pencegahan Primitive Obsession:** Status fungsi helper (misal: `isJustificationLocked`) wajib menggunakan union canonical `SimulationStatus | string` dari `@shared/types`.
4. **Read-Only Pass-through:** Komponen `MaterialityParamsCard` dan `MaterialityJustificationModal` wajib menghormati flag `isReadOnly` eksplisit untuk viewer/auditor pasif.
