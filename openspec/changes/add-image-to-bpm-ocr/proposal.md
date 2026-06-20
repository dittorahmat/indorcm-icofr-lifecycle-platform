## Why

Currently, PT Batubara Nusantara Sejahtera (the current demo entity) and other State-Owned Enterprises (BUMN) must manually construct their Business Process Maps (BPM) from scratch using drag-and-drop on the React Flow canvas. Many organizations already have existing workflow diagrams documented in PDF, JPG, or PNG formats. Manually recreating these diagrams is time-consuming and error-prone, creating a bottleneck in digitizing the Internal Control over Financial Reporting (ICOFR) lifecycle.

Introducing an automated Image-to-BPM OCR parser will enable users to instantly import and map their existing processes in compliance with Regulation SK-5/DKU.MBU/11/2024.

## What Changes

- **Add BPM Diagram Import Option**: Add an "Import from Image/PDF" option in the `BPMEditor` canvas toolbar.
- **Multimodal AI Parser Endpoint**: Implement a backend endpoint (`/api/bpm/ocr`) to receive base64 image data, process it using a vision-capable AI model (Google Gemini for cloud, or Gemma 4 / Qwen2-VL for on-premise), and return structured React Flow nodes and edges conforming to SK-5 Lampiran 3.
- **PDF-to-Image Conversion**: Add client-side PDF rendering using `pdfjs-dist` to convert uploadable PDF pages into images before sending them to the API.
- **Side-by-Side Review Dialog**: Implement an interactive verification modal where the user can compare the original diagram (left) with the reconstructed React Flow diagram (right) and refine labels, shapes, or connections before committing them.

## Capabilities

### New Capabilities
- `image-to-bpm-ocr`: Provides the ability to upload workflow images or PDFs and extract structured process flow diagrams conforming to SK-5 Lampiran 3 legends (Oval Start/End, Rectangle Activity, Diamond Decision, Inverted Triangle Archive, Cylinder Data Media/System).

### Modified Capabilities
*None*

## Impact

- **Frontend (`src/components/rcm/BPMEditor.tsx`)**: New import buttons, file dropzone UI, and interactive side-by-side verification dialog.
- **Backend Worker (`worker/routes/ai-docs.ts` / `worker/services/ai-service.ts`)**: New API route and model invocation utilities using structured output schemas.
- **Environment Variables**: Add configuration parameters for VLM settings (`AI_CHAT_MODEL`, `AI_PROVIDER`, etc.) to support local/on-premise models (Ollama/vLLM) interchangeably.
