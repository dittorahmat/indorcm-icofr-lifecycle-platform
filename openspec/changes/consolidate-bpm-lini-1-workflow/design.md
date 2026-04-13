## Context

Aplikasi IndoRCM saat ini memperlakukan Lini 1 sebagai entitas tunggal tanpa pembedaan departemen atau hirarki tanggung jawab. Regulasi SK-5/2024 mewajibkan adanya pemisahan tugas (Segregation of Duties) bahkan di dalam Lini 1, di mana pemilik proses (Staff) melakukan dokumentasi dan atasan langsung (Manager) melakukan validasi. Selain itu, akses ke dokumentasi BPM harus dibatasi hanya untuk departemen yang relevan dengan akun tersebut.

## Goals / Non-Goals

**Goals:**
- Mengimplementasikan hirarki Staff-Manager di Lini 1.
- Menyediakan mekanisme penugasan akun GL ke departemen.
- Mengintegrasikan seluruh alur kerja BPM ke dalam modal popup tunggal.
- Mengotomatisasi log perubahan (Lampiran 6) untuk setiap persetujuan.
- Mendukung cetak format Lampiran 4.

**Non-Goals:**
- Implementasi workflow Lini 2 (ICOFR Fungsi) dalam modal ini (tetap di halaman evaluasi terpisah).
- Migrasi data historis RCM lama (hanya berlaku untuk BPM baru/update).

## Decisions

### 1. Data Model: Organization & Leveling
Menambahkan entitas `Department` dan memperbarui `User` untuk mendukung filter akses.
- **Rationale**: Hirarki eksplisit diperlukan untuk memvalidasi siapa yang boleh mengedit vs menyetujui.
- **Alternatives**: Menggunakan sistem tag/label sederhana pada User (terlalu lemah untuk audit).

### 2. BPM Workflow State Machine
Setiap baris di `BPMWorksheet` (entitas `Control`) akan memiliki status internal:
`Draft (Staff)` -> `Pending Approval (Manager)` -> `Approved (Live)`.
- **Diagram Alur**:
```
┌─────────┐      ┌─────────┐      ┌───────────┐
│  Staff  │─────▶│ Manager │─────▶│ ChangeLog │
│ (Input) │      │(Approve)│      │ (Appended)│
└─────────┘      └─────────┘      └───────────┘
     ▲                │
     └────────────────┘
          (Reject)
```

### 3. Integrated Modal UI
Memindahkan worksheet dari halaman `/rcm` ke dalam komponen `BPMModal.tsx` yang dipanggil dari `GLDataGrid` (Scoping) atau `BPMPage`.
- **Rationale**: Mengurangi fragmentasi UI dan memastikan user bekerja dalam konteks akun yang benar.

### 4. PDF Generation (Lampiran 4)
Menggunakan library client-side (seperti `jspdf` atau `react-to-print`) untuk mencetak tampilan Modal secara langsung dengan styling khusus regulasi.
- **Rationale**: Memudahkan user mendapatkan dokumen instan tanpa server-side rendering yang berat.

## Risks / Trade-offs

- **[Risk]**: User berpindah departemen → **Mitigation**: Implementasi `effectiveDate` pada penugasan dan log audit.
- **[Risk]**: Kompleksitas UI pada Modal yang terlalu besar → **Mitigation**: Penggunaan Tabs di dalam Modal (Worksheet, Diagram, Log Perubahan).
- **[Risk]**: Performa pada GL Grid dengan banyak penugasan → **Mitigation**: Optimasi query di worker untuk fetch assignment secara batch.
