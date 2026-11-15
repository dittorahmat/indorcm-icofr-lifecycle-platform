# Standar Tabel & Matriks Kepatuhan (RCM, Audit, & Scoping)

Dokumen ini mendefinisikan standar tata kelola dan implementasi teknis untuk komponen tabel dan matriks kerja kepatuhan di IndoGRC Pro.

## 1. Standardisasi Indikator Boolean
Seluruh status biner kepatuhan (seperti *Key Control*, indikasi *Fraud*, asersi *IPO*, asersi *Financial Statement*, dan prinsip COSO) **WAJIB** menggunakan komponen atomik terstandarisasi `<BooleanIndicator />` (`src/components/rcm/BooleanIndicator.tsx`).

### Aturan Tipografi & Nada Warna:
- **Font & Ukuran:** `font-mono text-xs select-none`.
- **Tone Semantik:**
  - `tone="default"`: Untuk asersi umum (IPO, Balance Sheet/Income Statement Assertions, prinsip COSO). Status Y menggunakan `font-semibold text-slate-800`, status N menggunakan `font-normal text-slate-400`.
  - `tone="primary"`: Khusus indikator *Key Control* (`isKeyControl`). Menampilkan `text-indigo-700 font-semibold`.
  - `tone="danger"`: Khusus indikator risiko kecurangan (*Fraud-related*). Menampilkan `text-rose-700 font-semibold`.
- **Dilarang:** Membuat elemen `<span>` inline ad-hoc dengan kombinasi warna/font arbitrer di dalam cell renderer.

## 2. Definisi Alignment Kolom Eksplisit
Definisi kolom tabel (`RCMColumn`, `ColumnDef`) **WAJIB** mendeklarasikan properti perataan secara eksplisit via:
```ts
align?: 'left' | 'center' | 'right'
```
- **Dilarang Keras:** Menggunakan *string-sniffing* atau *feature envy* pada ID/accessor kolom (seperti `id.startsWith('coso-')` atau `id === 'fraud'`) di dalam komponen tabel dasar.
- Komponen tabel bertanggung jawab meneruskan properti `align` ke header (`<th>`) maupun ke sel data (`<td>`).

## 3. Locking Tests Kanvas & Matriks Lebar
Setiap komponen tabel atau matriks yang memanfaatkan `minWidth` horizontal kustom (seperti kanvas penuh TLC/ELC/ITGC dengan lebar > 2000px) dan tab overview **WAJIB** memiliki unit test pengunci (`*.test.tsx`) yang:
1. Memverifikasi style atau class `minWidth` kontainer tabel.
2. Memverifikasi alokasi lebar kolom-kolom kritis (seperti `min-w-[280px]` untuk nama kontrol).
3. Memverifikasi pewarisan kelas alignment (`text-center` / `text-right`) pada header dan sel.
