# Standar Dokumen & API Analytics

Dokumen ini memuat standar teknis untuk endpoint analitik (`worker/routes/analytics*`) dan komponen antarmuka analitik eksekutif.

## 1. Anti-Leakage Token Presentasi di Backend

- **Larangan:** Endpoint backend DILARANG MENGEMBALIKAN token styling UI seperti nama class Tailwind CSS (`text-emerald-700`, `bg-rose-50`, `border-amber-200`, dsb.) di dalam payload JSON.
- **Solusi:** Backend hanya boleh mengirim data mentah atau enum semantik domain (misal: `residualStatus: 'Low' | 'Moderate' | 'High'`).
- **Penegakan Mekanis:** Skrip gate `scripts/check-worker-strings.mjs` memblokir class token UI pada routes worker saat pre-commit.
- **Konsumen Antarmuka:** Pemetaan warna, badge, icon, dan styling dilakukan sepenuhnya di komponen UI client.

## 2. Mobile-Responsive & Partisi Kuadran Matriks Risiko

- Pada tampilan smartphone (< 640px), matriks risiko 5x5 wajib menyediakan:
  - Pembungkus scroll sentuh horizontal `overflow-x-auto touch-pan-x min-w-[500px]`.
  - Toggle cepat ke **Quadrant List View** yang mempartisi kontrol ke dalam 4 kuadran keparahan (Extreme, High, Medium, Low) agar keterbacaan pada layar sempit tetap optimal tanpa harus menggeser kanvas.
