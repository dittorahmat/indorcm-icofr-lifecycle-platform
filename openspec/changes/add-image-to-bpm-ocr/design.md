## Context

The current `BPMEditor` canvas requires users to draw business process flows manually. To accelerate the digitization of the ICOFR lifecycle under Regulation SK-5/DKU.MBU/11/2024, we need an automated way to ingest existing workflow diagrams (PDF, JPG, PNG) and translate them directly into React Flow graph states.

The application already has a Hono backend worker and an `AIService` which handles Gemini API calls. We will leverage this AI infrastructure to support vision-based diagram-to-JSON parsing.

## Goals / Non-Goals

**Goals:**
- Provide a file upload UI in the `BPMEditor` to accept PNG, JPG, and PDF files.
- Render PDF pages as images on the client side using `pdfjs-dist`.
- Implement a backend `/api/bpm/ocr` endpoint that supports both Google Gemini (Cloud) and OpenAI-compatible local endpoints (e.g., Ollama or vLLM running Gemma 4 or Qwen2-VL).
- Map visual flowchart shapes to the custom nodes in `BPMCustomNodes.tsx` (oval, hexagon, rectangle, cylinder, diamond, inverted triangle, document, etc.).
- Build a side-by-side verification modal allowing users to inspect the parsed diagram against the source image and make corrections before applying it.

**Non-Goals:**
- Fully automatic linking of newly parsed nodes to existing Risks or Controls (this linkage should be done manually or via existing scoping matrices once nodes are created).
- Automatic text translation or restructuring of the flowchart contents (the AI should capture the labels exactly as they appear in the source diagram).

## Decisions

### Decision 1: Agnostic Multimodal AI Integration via OpenAI-compatible endpoints
- **Option A (Gemini SDK only)**: Call Gemini Developer API exclusively.
- **Option B (Custom OpenCV contour analysis)**: Write custom computer vision code to detect shapes and run basic OCR.
- **Option C (Agnostic AI service wrapper - SELECTED)**: Use the existing `AIService` structure, extending it to support multimodal prompts (sending base64 image data). If `AI_PROVIDER` is `openai-compatible`, the payload is formatted using standard OpenAI Chat Completions formats (used by Ollama, vLLM, etc. to run Gemma 4 or Qwen2-VL).
- **Rationale**: Option C allows the client to demo on the cloud (Gemini) and deploy on-premise (Gemma 4 / Qwen2-VL) without any backend code changes. Option A causes vendor lock-in. Option B is too brittle for complex flowcharts.

### Decision 2: Client-side PDF rendering using `pdfjs-dist`
- **Option A (Server-side PDF processing)**: Send raw PDF files to the Cloudflare Worker, and let the backend parse them.
- **Option B (Client-side rendering - SELECTED)**: Use `pdfjs-dist` in the React frontend to render PDF pages into a `<canvas>`, export to base64, and send only the image to the backend.
- **Rationale**: Cloudflare Workers have strict CPU and memory execution limits (especially on free/standard tiers). Processing heavy PDFs on the edge can cause timeouts. Client-side rendering is fast and shifts the processing load to the user's browser.

### Decision 3: Relative Coordinate Normalization (0-1000)
- **Option A (Absolute Coordinates)**: Force the AI to guess exact pixel coordinates.
- **Option B (Normalized Coordinates - SELECTED)**: Instruct the AI to output coordinates normalized to a `0` to `1000` grid. The frontend will scale these values based on the viewport size of the React Flow canvas.
- **Rationale**: viewports vary across devices. Normalizing coordinates ensures that the diagram remains centered and proportional when loaded into React Flow.

## Risks / Trade-offs

- **[Risk] Shape/Text Misclassification**: AI may read a rectangle as an oval, or read labels incorrectly due to bad image quality.
  - *Mitigation*: The side-by-side verification UI acts as a validation gate. The user reviews the output and manually adjusts any nodes or connections before saving.
- **[Risk] Node Overlaps**: AI may stack multiple nodes on similar coordinates.
  - *Mitigation*: Implement a client-side layout cleaner/spacing utility or auto-align layout option (using simple grid snapping) to ensure nodes are readable.
- **[Risk] Worker Payload Size Limits**: Large base64 images might exceed Worker request limits.
  - *Mitigation*: The frontend SHALL compress/downscale the canvas image if the width/height exceeds 2048px before sending it to the backend.
