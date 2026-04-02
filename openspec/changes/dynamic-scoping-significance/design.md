## Context

Saat ini, `ScopingPage.tsx` menggunakan fungsi `handleDataImported` yang mem-filter akun GL segera setelah di-upload menggunakan nilai `pm` yang ada pada saat itu. Data hasil filter ini disimpan dalam state `localAccounts`. Masalahnya adalah jika pengguna mengubah parameter materialitas di UI, `localAccounts` tidak diperbarui, sehingga tampilan menjadi tidak akurat dan akun yang sebelumnya di-filter (insignificant) tidak bisa dimunculkan kembali tanpa re-upload.

## Goals / Non-Goals

**Goals:**
- Menghilangkan proses filtering pada saat data GL di-upload.
- Membuat penentuan status 'Significant' bersifat reaktif terhadap nilai `performanceMateriality` saat ini.
- Memastikan UI menampilkan seluruh daftar akun GL yang di-upload.

**Non-Goals:**
- Mengubah struktur data `SignificantAccount` di `shared/types.ts`.
- Mengimplementasikan sinkronisasi otomatis dengan ERP (masih manual upload).

## Decisions

### 1. Remove Filter in `handleDataImported`
**Decision**: Menghapus baris `.filter(acc => acc.isQuantitative)` pada fungsi `handleDataImported`.
**Rationale**: Agar state `localAccounts` menyimpan seluruh data akun yang tersedia di file GL, sehingga memungkinkan perhitungan dinamis di tahap selanjutnya.

### 2. Derive Significance in Render Loop
**Decision**: Menghitung status signifikansi langsung di dalam `.map()` saat merender tabel `Significant Accounts Matrix`.
**Rationale**: Karena `performanceMateriality` adalah nilai yang dihitung secara dinamis dari state form, menggunakan nilai ini langsung saat render memastikan status 'Significant' selalu akurat dan reaktif.

### 3. Account Highlighting
**Decision**: Menggunakan varian `Badge` yang berbeda (default vs secondary) dan mungkin menambahkan styling baris (opacity) untuk akun 'Insignificant'.
**Rationale**: Membantu pengguna secara visual membedakan akun mana yang masuk dalam ruang lingkup ICOFR dan mana yang tidak, meskipun keduanya ditampilkan dalam satu tabel.

## Risks / Trade-offs

- **Performance** [Risk] → Jika file GL sangat besar (ribuan baris), merender semuanya dalam tabel tanpa pagination dapat memperlambat browser.
- **Mitigation** → Untuk saat ini, asumsikan jumlah akun (FSLI level) masih dalam batas wajar (< 500 baris). Jika di masa depan performa menurun, kita bisa menambahkan virtualized list atau pagination sederhana.
