## Context

Saat pengujian TOD (Test of Design) atau CSA menyatakan pengendalian `Ineffective`, sistem secara otomatis membuat *Deficiency* pada `/deficiencies` (Deficiency Board). Namun, hirarki visual pada kartu defisiensi UI saat ini menjadikan catatan/kesimpulan pengujian (misal: `"Hasil Verifikasi Desain (TOD) Ineffective: No justification provided."`) sebagai Judul Utama Kartu (`CardTitle`). Hal ini menyulitkan pengguna dalam mengidentifikasi secara instan Kontrol dan Risiko apa yang sebenarnya bermasalah. 

Selain itu, pada formulir pengisian rencana remedi (`RemediationForm.tsx`), field **`Related Function`** dan **`Person In Charge (PIC)`** masih berupa `Input` teks manual bebas yang rawan kesalahan pengetikan dan ketidakseragaman data.

## Goals / Non-Goals

**Goals:**
- Menata ulang hirarki visual komponen `DeficiencyCard.tsx` agar Kode Kontrol (`controlCode`) dan Nama Kontrol (`controlName`) tampil prominent sebagai **Judul Utama Kartu**.
- Menampilkan metadata Kode Risiko (`riskCode`) / Deskripsi Risiko secara eksplisit jika tersedia.
- Mengubah status/catatan evaluasi TOD/CSA (seperti `"Hasil Verifikasi Desain (TOD) Ineffective..."`) menjadi subtext/keterangan pendukung (*Audit Finding / Justification Note Box*), bukan judul utama.
- Memperbarui payload API `/api/deficiencies` agar turut menyertakan relasi risiko (`riskCode`).
- Mengubah field `Related Function` dan `Person In Charge (PIC)` pada `RemediationForm.tsx` dari teks input biasa menjadi komponen `<Select>` dropdown dinamis berbasis data terdaftar dari `/api/departments` dan `/api/users`.
- Menambahkan **logika cascading interaktif** antara `Related Function` dan `PIC`, di mana daftar pilihan PIC tersaring hanya menampilkan personel dari fungsi/departemen yang terpilih.

## Non-Goals:
- Mengubah alur kerja Kanban remedi atau logika pohon keputusan DoD Wizard.

## Decisions

1. **Restrukturisasi Hirarki Visual `DeficiencyCard.tsx`**:
   - **Judul Utama (`CardTitle`)**: Menampilkan Kode Kontrol & Nama Kontrol secara lengkap dan menonjol (menghapus `line-clamp-1` agar nama kontrol terbaca utuh).
   - **Badges Bar**: Badges keparahan (`Control Deficiency`, `Material Weakness`), Sumber (`Lini 2 - TOD Review`), dan Kode Risiko (`riskCode`) berada di header kartu.
   - **Kotak Catatan Temuan/Evaluasi (`Finding / Justification Note Box`)**: Teks deskripsi pengujian/kesimpulan sistem seperti `"Hasil Verifikasi Desain (TOD) Ineffective: ..."` ditampilkan di bagian bawah kartu dalam kotak aksen tipis (`bg-slate-50/border-slate-200`) sebagai catatan latar belakang temuan.

2. **Backend Relation Query Enhancement (`remediation.ts`)**:
   - `GET /api/deficiencies` melakukan JOIN tambahan ke tabel `rcms` / `risks` untuk mengembalikan `riskCode` sehingga informasi risiko terkait kontrol yang bermasalah bisa dirender di kartu.

3. **Penggunaan Dropdown Dinamis & Cascading untuk `Related Function` & `PIC` (`RemediationForm.tsx`)**:
   - Menggunakan `useQuery` TanStack Query untuk me-fetch daftar unit kerja dari `/api/departments` dan pengguna dari `/api/users`.
   - Mengganti elemen `Input` dengan `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` Radix UI.
   - **Cascading Filter**: Opsi `userList` pada dropdown PIC di-filter berdasarkan `departmentId` yang cocok dengan `relatedFunction` yang sedang terpilih pada `form.watch('relatedFunction')`.

## Risks / Trade-offs

- **[Risk]** Untuk data legacy di mana `relatedFunction` atau `picName` belum sesuai nama departemen/user terdaftar, dropdown harus mengizinkan penayangan nilai lama sebagai opsi terpilih.
  - *Mitigation*: Selalu sediakan opsi item fallback jika nilai `actionPlan.relatedFunction` atau `actionPlan.picName` tidak ada dalam daftar yang di-fetch dari API.
