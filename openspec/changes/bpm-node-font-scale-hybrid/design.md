## Architecture

Implementasi solusi hybrid ini menggunakan kombinasi CSS variables, dynamic component props pada React Flow custom nodes, serta reactive state hooks di React/Zustand:
1. **Global Scale State**: Menggunakan local state di `BPMEditor` (dan/atau `metadata` diagram) yang diteruskan ke sub-components menggunakan CSS custom property (variabel CSS seperti `--bpm-global-scale`) di container React Flow.
2. **Dynamic Prop Overrides**: Custom nodes akan menerima properti individual dari object `data` node (`nodeScaleOverride`, `fontScaleOverride`) untuk secara kondisional menimpa (override) ukuran SVG/Font bawaan.
3. **Flexible Flexbox / Auto-wrapping**: Node yang memiliki container teks di dalam SVG atau absolute div di-refaktor untuk memakai CSS flexbox, `word-break: break-word`, serta tinggi dinamis.

## Data Model

Tidak ada perubahan skema database PostgreSQL. Data preferensi visual disimpan di dalam kolom JSONB `metadata` dari tabel `bpm_diagrams` (yang sudah terdefinisi di shared types dan backend).
- `metadata.globalScale`: string/number (pilihan skala global, default `100`).
- Di data node React Flow (kolom `nodes`):
  - `node.data.nodeScaleOverride`: string (`"sm" | "md" | "lg" | undefined`)
  - `node.data.fontScaleOverride`: string (`"sm" | "md" | "lg" | undefined`)

## API / Interface

Tidak ada modifikasi rute API baru. API penyimpanan diagram yang sudah ada (`POST /api/bpm-diagrams`) akan menerima payload yang mencakup metadata baru ini dan menyimpannya secara transparan.

## Components / Modules

- **Modify [BPMEditor.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/BPMEditor.tsx)**:
  - Tambahkan dropdown pilihan skala global di sebelah tombol `Linked GLs`. Dropdown berisi pilihan: `80% (Small)`, `100% (Medium)`, `120% (Large)`.
  - Pasangkan class CSS yang dinamis ke pembungkus React Flow (`className={cn("...", globalScale === 80 && "bpm-scale-sm", globalScale === 120 && "bpm-scale-lg")}`) atau atur style CSS variables `--bpm-global-scale` secara dinamis.
  - Saat diagram disimpan, pastikan preferensi `globalScale` disertakan dalam `metadata`.

- **Modify [BPMCustomNodes.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/nodes/BPMCustomNodes.tsx)**:
  - Buat helper utility `getNodeStyles(data)` untuk menghitung lebar/tinggi dan ukuran font berdasarkan gabungan skala global dan override per node.
  - Untuk setiap custom node (misal `ActivityNode`, `AutomatedActivityNode`, `DecisionNode` dll.):
    - Ganti style lebar/tinggi statis (`min-w-[160px] h-14` dsb.) dengan dynamic style yang dihasilkan oleh helper utility.
    - Bungkus teks label dengan CSS rule wrapping: `whitespace-pre-wrap break-words overflow-visible`.
    - Untuk node berbentuk SVG (seperti `ManualInputNode`, `DocumentNode`, `DecisionNode`), ubah attribute `viewBox` or gunakan CSS transform scale agar SVG dapat meregang mengikuti ukuran teks tanpa pecah/pecah-pecah.

- **Modify [RegulatoryPropertySheet.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/rcm/properties/RegulatoryPropertySheet.tsx)**:
  - Di bawah bagian *Visual Info*, tambahkan form dropdown baru:
    - **Node Scale Override**: Standard, Small, Large.
    - **Font Size Override**: Standard, Small, Large.
  - Pilihan ini akan menembakkan callback `onUpdateNodeData` untuk memperbarui field `nodeScaleOverride` dan `fontScaleOverride` pada node yang bersangkutan.

## Risk / Edge Cases

- **Teks Terpotong Pada SVG Tertentu**: Beberapa node memiliki path SVG kompleks (seperti `DecisionNode` yang berupa belah ketupat atau `ManualInputNode` yang miring).
  - *Mitigasi*: Alih-alih merentangkan path SVG secara naif yang bisa merusak rasio aspek miringnya, kita dapat menyematkan teks di dalam tag `<foreignObject>` di dalam SVG atau menggunakan penampang teks absolut terpisah dengan layout flex centering, lalu menyesuaikan dimensi visual node secara proporsional.
- **Koneksi Edge Bergeser**: React Flow mendeteksi posisi handle koneksi berdasarkan dimensi luar node. Jika ukuran node berubah secara dinamis, handle koneksi bisa bergeser.
  - *Mitigasi*: Panggil fungsi `updateNodeInternals` dari React Flow ketika pengguna mengubah konfigurasi skala node agar garis konektor (edges) langsung menyesuaikan ke posisi handle yang baru.
