## 1. Backend AI Suite Extension

- [x] 1.1 Update `worker/services/ai-service.ts` to support multimodal prompts (sending base64 image data blocks alongside text instructions).
- [x] 1.2 Implement the JSON schema verification logic in `AIService` to enforce structured diagram output format.
- [x] 1.3 Create the Hono route endpoint `POST /api/bpm-diagrams/ocr` in `worker/routes/bpm.ts` or a new handler in `ai-docs.ts` to handle diagram image analysis.
- [x] 1.4 Test endpoint routing using both the Gemini client SDK configuration and the OpenAI-compatible local API wrapper options.

## 2. Client-Side Image & PDF Processing

- [x] 2.1 Integrate `pdfjs-dist` in the frontend context to extract and render PDF pages on HTML Canvas components.
- [x] 2.2 Create a file parsing helper (`src/utils/diagram-parser.ts`) to scale and compress high-resolution images down to a maximum of 2048px before transmission.
- [x] 2.3 Write tests for the client-side file compression and PDF rendering utilities.

## 3. BPM Editor UI Integration

- [x] 3.1 Modify the `BPMEditor` canvas toolbar to include the "Impor Alur dari Gambar/PDF" button.
- [x] 3.2 Build the upload/dropzone modal dialog supporting drag-and-drop of PDF, JPG, and PNG files.
- [x] 3.3 Create the Side-by-Side Review Dialog showing the uploaded original image (left) and the React Flow parsed canvas (right).
- [x] 3.4 Hook up the "Simpan & Terapkan" commit button to overwrite the current canvas nodes and edges state and close the preview modal.

## 4. Verification and Quality Assurance

- [x] 4.1 Perform a complete TypeScript check by running `npm run type-check`.
- [x] 4.2 Validate lint standards by running `npm run lint`.
- [x] 4.3 Verify system compilation by executing `npm run build`.
