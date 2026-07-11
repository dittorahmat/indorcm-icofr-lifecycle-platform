## Why

Pengguna mengalami kendala saat mencoba melakukan rollback atau unlock pada simulasi scoping yang sudah berstatus "Approved". Sistem memunculkan peringatan "unsaved changes" (perubahan belum disimpan) meskipun halaman dalam mode baca saja (read-only/locked). Hal ini disebabkan oleh kesalahan deteksi `isDirty` yang menghasilkan nilai `true` akibat ketidakcocokan antara nilai `null` dari database dan nilai default (seperti `''` atau `0`) pada state frontend, serta tidak adanya bypass `isDirty` saat data dalam keadaan terkunci.

## What Changes

- Menambahkan kondisi short-circuit pada penentuan status `isDirty` di `useScopingEditor` agar otomatis mengembalikan nilai `false` saat simulasi dalam keadaan terkunci (locked).
- Melakukan normalisasi pada perbandingan status `currentState` dan `originalState` dalam hook `useScopingEditor` untuk menghindari deteksi false-positive yang disebabkan oleh perbedaan tipe/nilai default (misalnya `null` di database dibanding `''` atau `0` di frontend).

## Capabilities

### New Capabilities
*Tidak ada.*

### Modified Capabilities
- `unsaved-changes-guard`: Menambahkan aturan bahwa halaman editor scoping yang berstatus terkunci (read-only) tidak boleh memicu status `isDirty` menjadi `true`, serta normalisasi data state untuk mencegah kesalahan deteksi.

## Impact

Perubahan ini hanya berdampak pada frontend:
- Berkas `src/pages/scoping/hooks/useScopingPage.ts` (pada hook `useScopingEditor`).
- Berkas spesifikasi `openspec/specs/unsaved-changes-guard/spec.md` (untuk menambahkan dokumentasi aturan baru).
