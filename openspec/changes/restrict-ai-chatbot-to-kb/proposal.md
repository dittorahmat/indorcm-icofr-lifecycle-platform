## Why

Pengguna melaporkan bahwa AI Chatbot menjawab secara melantur di luar dokumen PDF regulasi/prosedur yang diunggah (contoh: menjawab pertanyaan umum tentang pedoman cuti ketenagakerjaan secara luas meskipun tidak ada dokumen cuti yang diunggah). Hal ini terjadi karena chatbot tidak dibatasi oleh system prompt yang ketat dan tidak diinstruksikan untuk membatasi jawaban hanya pada KNOWLEDGE BASE dan cakupan aplikasi IndoGRC Pro (regulasi SK-5 dan modul ICOFR terkait).

## What Changes

- Penambahan instruksi grounding ketat pada System Instruction AI Chatbot agar menolak menjawab pertanyaan umum yang di luar cakupan dokumen diunggah dan fitur IndoGRC Pro.
- Modifikasi logika pembentukan `KNOWLEDGE BASE` pada chatbot ketika hasil pencarian dokumen kosong atau tidak relevan, sehingga model memahami keterbatasan informasi.
- Penambahan verifikasi testing untuk memastikan perilaku chatbot tetap patuh pada instruksi grounding dan menolak menjawab pertanyaan off-topic (misalnya tentang resep makanan atau kebijakan cuti umum).

## Capabilities

### New Capabilities
*(Tidak ada)*

### Modified Capabilities
- `ai-agentic-assistant`: Penambahan kebutuhan Strict Grounding & Domain Limitation untuk membatasi ruang lingkup jawaban AI hanya pada regulasi SK-5, fitur/modul IndoGRC Pro, serta dokumen PDF yang secara sah diunggah ke Knowledge Base.

## Impact

- File API Backend: [ai-docs.ts](file:///C:/backup/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts) (Modifikasi `systemInstruction` dan penanganan RAG).
- File Pengujian: [ai-service.test.ts](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/test/ai-service.test.ts) (Penambahan skenario uji untuk grounding dan penolakan pertanyaan off-topic).
