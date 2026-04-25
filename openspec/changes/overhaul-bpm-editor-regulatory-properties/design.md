# Design: Hierarchical Regulatory Panel & Auto-Cleanup

## Architecture
Pemisahan logika panel properti menjadi `RegulatoryPropertySheet.tsx` yang mendukung pengelompokan data dinamis.

### 1. Data Structure (`regulatoryPairs`)
Alih-alih objek tunggal, node aktivitas sekarang menyimpan array of objects:
```typescript
data: {
  regulatoryPairs: Array<{
    riskId: string;
    controlId: string;
    // ... metadata compliance
  }>
}
```
UI melakukan grouping berdasarkan `riskId` secara real-time menggunakan `useMemo`.

### 2. Backend Auto-Cleanup (Integritas Data)
Backend `PUT /api/bpm-diagrams/:id` bertanggung jawab atas kebersihan database:
- **Tracking**: Backend membandingkan ID Risiko/Kontrol di DB dengan yang ada di visual diagram.
- **Hard Delete**: Record `rcms` dan `controls` yang sudah tidak ada di diagram (tapi masih tertaut ke ID diagram tersebut) akan dihapus secara fisik untuk mencegah data yatim.

### 3. Synchronization & Status
- **isNodeDirty Logic**: Menghitung perbedaan antara `current.data` dan `diagram.original.data`.
- **Dynamic Footer**: Menampilkan status "Synced" (Hijau) vs "Pending Sync" (Kuning) berdasarkan flag `isDirty`.
- **Save Trigger**: Tombol di dalam Sheet memicu `saveMutation` diagram utama, yang kemudian melakukan *refetch* untuk mereset status `isDirty`.

### 4. Visual Hirarki
- **Risk Card (Red)**: Header utama untuk informasi risiko.
- **Control Card (White)**: Item nested (indented) dengan garis penghubung putus-putus.
- **Action Buttons**: Tersedia tombol hapus spesifik di tiap level (Hapus Kontrol vs Hapus 1 Grup Risiko).

### 5. Double-Layer Safety
- **Internal**: `useBlocker` untuk navigasi antar halaman.
- **Sheet Guard**: `window.confirm` saat mencoba menutup popup jika ada data `isDirty`.
- **Localized Warnings**: Seluruh pesan peringatan ditarik dari sistem i18n (`rcm.json`).
