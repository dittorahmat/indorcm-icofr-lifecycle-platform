## Why

Saat ini, pembuatan dan pengeditan proses bisnis di BPM editor terasa kaku karena 31 jenis node hanya memiliki dua titik koneksi (atas dan bawah). Pengguna tidak dapat menghubungkan node secara fleksibel ke samping atau diagonal, sulit menyelaraskan posisi node secara presisi tanpa bantuan panduan visual, serta memerlukan langkah manual untuk menarik koneksi. Perubahan ini mengadopsi interaksi visual setara Microsoft Visio untuk meningkatkan produktivitas dan kenyamanan pengguna dalam mendokumentasikan diagram alur bisnis.

## What Changes

- **8 Universal Connection Handles**: Mengubah 31 jenis node BPM yang sebelumnya hanya memiliki handle atas & bawah menjadi 8 titik handle dua arah (atas-kiri, atas-tengah, atas-kanan, tengah-kiri, tengah-kanan, bawah-kiri, bawah-tengah, bawah-kanan) sehingga koneksi dapat keluar dan masuk dari titik mana pun.
- **Dynamic Smart Alignment Guides**: Menghadirkan garis panduan magnetik otomatis (putus-putus) saat menggeser (*drag*) node ketika bagian tengah (*center*), tepi atas/bawah, atau tepi kiri/kanan sejajar dengan node lain di kanvas.
- **Quick Connect Hover Arrows**: Menampilkan tombol panah bantu interaktif di sekeliling node saat kursor diarahkan (*hover*) untuk memicu koneksi cepat ke node target.
- **Routing Kompatibilitas Ortogonal**: Memperbarui router garis `BridgeEdge` agar mengenali titik koneksi sudut (corner) dan sisi samping secara presisi.

## Capabilities

### New Capabilities
- `bpm-visio-interactions`: Perilaku interaksi visual kanvas setara Visio meliputi 8 titik koneksi pada shape node proses, panduan penyelarasan magnetik (*smart alignment guides*), dan panah koneksi cepat (*quick-connect hover arrows*).

### Modified Capabilities
- `bpm-edge-visuals`: Menyesuaikan kalkulasi titik jangkar koneksi pada router `BridgeEdge` untuk mendukung 8 titik posisi handle spesifik (termasuk titik sudut).

## Impact

- Frontend: `src/components/rcm/nodes/BPMCustomNodes.tsx` (reusable `EightConnectionHandles`), `src/components/rcm/BPMEditor.tsx` (smart alignment listener & guide overlay), `src/components/rcm/edges/BridgeEdge.tsx` (handle coordinate resolver).
- Tanpa perubahan skema database PostgreSQL dan tanpa perubahan API backend worker.
