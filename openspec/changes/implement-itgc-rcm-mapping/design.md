## Context

Aplikasi IndoGRC Pro saat ini mengelola Risiko dan Kontrol melalui Business Process Mapping (BPM). Setiap aktivitas dapat memiliki pasangan metadata regulasi (`regulatory_pairs`) yang dikategorikan menjadi TLC (Transaction Level Control), ELC (Entity Level Control), atau ITGC (IT General Control). 

Meskipun kategori ITGC sudah ada di form input, tampilannya di Matriks regulasi belum diimplementasikan sesuai standar **SK-5/2024 Lampiran 5.c**. Selain itu, field krusial seperti "Aplikasi Pendukung" dan "Jenis Pengendalian Otomatis" belum tersedia di skema database.

## Goals / Non-Goals

**Goals:**
- Membuat halaman `RCMITGCPage.tsx` yang menampilkan matriks horizontal sesuai Lampiran 5.c SK-5/2024.
- Memperluas skema database `regulatory_pairs` untuk menampung metadata operasional TI.
- Memastikan navigasi antara BPM Editor dan Matriks ITGC tetap sinkron.
- Memberikan panduan tooltip bagi user untuk menentukan klasifikasi ITGC yang benar.

**Non-Goals:**
- Mengubah logika kalkulasi asersi keuangan pada TLC.
- Menampilkan asersi CIA (Confidentiality, Integrity, Availability) pada laporan resmi ITGC (karena tidak diminta oleh Lampiran 5.c).

## Decisions

1. **Schema Expansion**: Menambahkan kolom `itgcDomain`, `supportingApp`, dan `automatedControlType` ke tabel `regulatory_pairs`.
   - *Rationale*: Data ini diwajibkan muncul di kolom xiv dan xvi pada Lampiran 5.c.
2. **Strict ITGC View**: Pada halaman `RCMITGCPage`, kolom asersi LK dan IPO akan disembunyikan sepenuhnya.
   - *Rationale*: Fokus ITGC adalah pada keandalan lingkungan sistem pendukung, bukan asersi transaksi langsung.
3. **Internal Documentation**: Field CIA yang sudah ada di `ITGCForm.tsx` akan tetap disimpan di database untuk kebutuhan audit internal/DoD, namun tidak dipaksa muncul di header tabel RCM ITGC.
4. **Dropdown Validation**: Field `automatedControlType` akan menggunakan list kaku (Enum): `Automated Control`, `Automated Calculation`, `Restricted Access`, `Interface`.

## Risks / Trade-offs

- **[Risk] Data Inconsistency** → User mengisi "Sifat: Manual" tapi mengisi "Jenis Otomatis". 
  - *Mitigation*: Implementasi conditional rendering di `ITGCForm.tsx` di mana field "Jenis Pengendalian Otomatis" dan "Aplikasi Pendukung" hanya muncul/aktif jika "Sifat Pelaksanaan" adalah `Automated`, `ITDM`, atau `MRC`.
- **[Risk] Migration Lock** → Penambahan kolom pada database Cloudflare D1 saat production.
  - *Mitigation*: Menggunakan migrasi Drizzle standar dengan default value NULL atau string kosong.
