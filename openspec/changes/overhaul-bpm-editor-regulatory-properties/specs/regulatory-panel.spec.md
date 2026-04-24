# Spec: Regulatory Property Panel & Matrix

## 1. Risk & Control Identity
- **Enforced Uniqueness**: Setiap node Activity hanya boleh memiliki satu pasangan Risiko-Kontrol yang didefinisikan secara unik.
- **Auto-ID**: Prefiks `R-` untuk Risiko dan `C-` untuk Kontrol diikuti angka urut otomatis.

## 2. ELC Compliance (Lampiran 5 a & Lampiran 1)
- **Matrix Layout**: Matriks ELC wajib menampilkan Kontrol sebagai Baris dan 17 Prinsip COSO sebagai Kolom.
- **Principles Mapping**: Disimpan sebagai array numerik `[1, 2, 8, 14...]`.
- **Glossary Tooltips**: Setiap header kolom prinsip (1-17) wajib menampilkan tooltip deskripsi lengkap dari Lampiran 1.

## 3. TLC Compliance (Tabel IPO)
- **Fields**: `ipoC` (Completeness), `ipoA` (Accuracy), `ipoV` (Validity), `ipoRa` (Restricted Access).
- **Tooltips**: Menjelaskan makna teknis masing-masing kriteria IPO untuk memandu user Lini 1.

## 4. Multi-Subsidiary View
- **Filter**: Halaman Matriks (TLC & ELC) wajib menyediakan filter "Anak Perusahaan".
- **Holding View**: User level Holding/Admin dapat melihat data gabungan atau per subsidiary.

## 5. Audit Trail (Lampiran 6)
- **On-Demand History**: Menampilkan list perubahan (Timestamp, User, Old Value -> New Value).
- **Contextual Access**: History harus dapat diakses langsung dari Property Sheet saat mengedit entitas tersebut.
