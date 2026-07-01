## Context

Saat ini, AI Chatbot di IndoGRC Pro dikonfigurasi melalui endpoint `/api/ai/chat` di [ai-docs.ts](file:///C:/backup/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts). Prompt `systemInstruction` yang ada tidak membatasi LLM untuk hanya menjawab berdasarkan KNOWLEDGE BASE yang didapat dari pencarian hybrid atas dokumen PDF yang diunggah. Akibatnya, ketika pengguna mengajukan pertanyaan di luar domain (misalnya tentang cuti karyawan), LLM menggunakan pengetahuannya sendiri untuk menjawab secara rinci, yang tidak relevan dengan data rahasia perusahaan maupun ruang lingkup tata kelola ICOFR.

## Goals / Non-Goals

**Goals:**
- Menambahkan instruksi grounding yang ketat pada `systemInstruction` di [ai-docs.ts](file:///C:/backup/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts) agar menolak menjawab pertanyaan di luar KNOWLEDGE BASE dan cakupan aplikasi IndoGRC Pro.
- Memastikan respon penolakan disampaikan secara sopan dan informatif bagi pengguna.
- Menambahkan unit test di [ai-service.test.ts](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/test/ai-service.test.ts) untuk memverifikasi penolakan pertanyaan di luar konteks (off-topic).

**Non-Goals:**
- Tidak mengubah skema database `document_chunks` atau algoritma `hybridSearch` saat ini.
- Tidak membangun model klasifikasi terpisah untuk menyaring input pengguna (cukup dengan *prompt constraints* di tingkat LLM utama demi efisiensi biaya dan performa).

## Decisions

### 1. Grounding Prompt Tuning di API Worker
Kita akan memperbarui teks `systemInstruction` di [ai-docs.ts](file:///C:/backup/indorcm-icofr-lifecycle-platform/worker/routes/ai-docs.ts).
- *Rationale*: Gemini 2.5 sangat patuh terhadap instruksi sistem. Memasukkan aturan grounding yang jelas langsung ke `systemInstruction` adalah metode tercepat dan paling efisien (latensi 0ms tambahan).
- *Alternatif*: Melakukan LLM pre-classification untuk mendeteksi off-topic. *Ditolak* karena menambah biaya API double dan meningkatkan latensi respons.

## Risks / Trade-offs

- **[Risk]** False Positives (AI menolak pertanyaan pengguna yang sebenarnya valid tetapi memiliki pencarian dokumen yang minim).
  - *Mitigation*: Prompt sistem harus secara eksplisit mengizinkan pertanyaan seputar fitur-fitur IndoGRC Pro itu sendiri (misalnya "Bagaimana cara melakukan scoping?") meskipun info tersebut tidak tertulis di dokumen RAG.
