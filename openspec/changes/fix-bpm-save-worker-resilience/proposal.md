## Why

Saat menyimpan diagram BPM hasil OCR atau diagram kompleks berskala besar di lingkungan Cloudflare Workers (`workers.dev`), klien mengalami error `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`. Masalah ini dipicu oleh dua hal utama:
1. `api-client.ts` di frontend langsung mem-parse respons server sebagai JSON tanpa memeriksa `Content-Type`, sehingga saat terjadi error HTTP tingkat gateway/edge (seperti Cloudflare 524 Timeout, 502 Bad Gateway, 401 Session Expired, atau 413 Payload Too Large) yang mengembalikan dokumen HTML, klien crash dengan pesan sintaks JSON yang membingungkan alih-alih menampilkan pesan error yang informatif.
2. Proses sinkronisasi diagram pada `PUT /api/bpm-diagrams/:id` di backend melakukan loop sekuensial (N+1 database roundtrips) untuk setiap node dan relasi risk-control ke database Neon/PostgreSQL over internet. Pada diagram hasil OCR dengan puluhan node/swimlane, puluhan roundtrip ini memakan waktu puluhan detik hingga menabrak timeout eksekusi Cloudflare Workers (Error 524). Selain itu, pasca wipeout database, diagram ID yang tersimpan di state klien atau URL bisa hilang dan memicu unhandled rejection.

## What Changes

- **Client-Side API Resilience**: Perbarui `src/lib/api-client.ts` untuk memeriksa header `Content-Type` sebelum melakukan parsing `res.json()`. Jika respons berupa HTML/text, tangkap status HTTP dan pesan error server secara elegan tanpa crash parser JSON.
- **Node & Payload Sanitization**: Bersihkan objek `nodes` dan `edges` di `src/components/rcm/BPMEditor.tsx` sebelum dikirim ke `PUT /api/bpm-diagrams/:id`, memastikan fungsi callback transient (`onToggleLock`, `onChangeDepartment`, dll.) tidak mengotori payload dan payload tetap ringkas.
- **Backend Batching & Performance**: Optimasi operasi sinkronisasi di `worker/services/bpm-service.ts` dan `worker/services/bpm/bpm-sync.ts` dengan menggunakan batch SELECT (`inArray`) dan batch INSERT/DELETE, mereduksi waktu eksekusi dari puluhan detik menjadi < 500 ms di Cloudflare Workers.
- **Missing Diagram & Wipeout Resilience**: Tambahkan penanganan eksplisit jika diagram target tidak ditemukan pada saat `PUT /api/bpm-diagrams/:id` (misal setelah wipeout database), dengan mengembalikan status 404 terstruktur atau mekanisme upsert yang aman.

## Capabilities

### New Capabilities
- `bpm-save-resilience`: Ketahanan proses penyimpanan diagram BPM di lingkungan serverless/Cloudflare Workers, mencakup penanganan non-JSON response pada API client, sanitisasi payload diagram, dan pemrosesan batching database yang tahan terhadap timeout.

### Modified Capabilities

## Impact

- Frontend: `src/lib/api-client.ts`, `src/components/rcm/BPMEditor.tsx`, `src/components/rcm/editor/hooks/useBPMCanvasHandlers.ts`.
- Backend Worker: `worker/services/bpm-service.ts`, `worker/services/bpm/bpm-sync.ts`, `worker/routes/bpm.ts`.
- Database: Tidak ada perubahan skema (menggunakan struktur Drizzle ORM yang sudah ada).
- Keandalan: Menghilangkan error `Unexpected token '<'` dan mencegah Cloudflare 524 Timeout saat menyimpan diagram hasil OCR.
