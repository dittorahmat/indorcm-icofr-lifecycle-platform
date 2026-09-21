# Change: Enhance BPM Diagram Edge Routing and Synchronized Auto-Layout

## Why
Pengguna melaporkan bahwa hasil diagram alur dari OCR (maupun setelah dijalankan auto-arrange) di BPM Editor masih berantakan:
1. **Garis dan Ujung Panah (Arrowhead) Tidak Terlihat Jelas**:
   - Arrowhead tertutup/tertimbun oleh node background (`z-index` dan bounding box) karena target point edge berpusat di border tanpa offset clearance.
   - Handle dot universal (`EightConnectionHandles`) bertumpuk di titik temu panah saat hover/aktif sehingga mengaburkan ujung panah.
2. **Garis Memotong & Menabrak Node di Swimlane Lain**:
   - Algoritma Manhattan orthogonal di `BridgeEdge.tsx` mengambil jalur lurus horizontal naif, memotong tepat di tengah-tengah node pada swimlane perantara.
3. **Auto-Arrange Tidak Sinkron Antar-Swimlane**:
   - Tiap swimlane diatur secara terisolasi dengan tumpukan 1 kolom kaku, tanpa menyinkronkan urutan kedalaman waktu (*topological step levels*) antar-swimlane.
   - Node input/dokumen ganda (seperti formulir, KTP, emas) ditumpuk lurus vertikal alih-alih ditata proporsional.

## What Changes
1. **Edge & Arrowhead Visibility (`BridgeEdge.tsx` & Node Styles)**:
   - Sesuaikan target point offset pada `BridgeEdge` (mundur 6-8px di luar batas node atau gunakan marker konfigurasi yang presisi) agar kepala panah utuh dan terlihat jelas.
   - Pastikan warna dan ketebalan marker panah kontras (`#0f172a`, stroke tegas).
   - Atur visibilitas titik handle agar tidak menutupi panah saat alur statis.
2. **Channel/Gutter Cross-Swimlane Routing (`BridgeEdge.tsx`)**:
   - Implementasikan gutter-aware routing sederhana untuk garis lintas-swimlane sehingga belokan horizontal melewati celah antar-node (koridor bersih) dan tidak memotong badan node lain.
   - Perbaiki pemetaan handle otomatis untuk node `decision` (`yes`, `no`), `document`, dan `manual-operation`.
3. **Global Synchronized Auto-Layout (`bpm-auto-layout.ts` & `ocr-layout.ts`)**:
   - Terapkan alokasi level Y berbasis alur global (Sugiyama-style rank / step leveling) sehingga tahapan proses antar-swimlane berada di baris ketinggian yang sinkron.
   - Tingkatkan penanganan node dokumen/masukan bersusun agar tidak bertumpuk membingungkan.
4. **Validasi & Pengujian**:
   - Unit test untuk perhitungan level alur dan routing edge pada auto-layout.
   - Verifikasi lint, type-check, dan build sesuai Mandat Penyelesaian Tahap.

## Impact
- `src/components/rcm/edges/BridgeEdge.tsx`: Routing Manhattan diperhalus dengan obstacle avoidance / gutter routing dan target arrowhead clearance.
- `src/utils/bpm-auto-layout.ts` & `src/utils/ocr-layout.ts`: Sinkronisasi koordinat vertikal (topological rank level) antar swimlane dan handle assignment yang akurat.
- `src/components/rcm/nodes/BaseNodeComponents.tsx`: Peningkatan estetika handle agar tidak menutupi arrowhead.
