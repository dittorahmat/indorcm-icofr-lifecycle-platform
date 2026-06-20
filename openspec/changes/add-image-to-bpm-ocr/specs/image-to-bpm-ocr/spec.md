## ADDED Requirements

### Requirement: Document Ingestion and Client-Side PDF Processing
The system SHALL allow users to upload workflow diagram files in PNG, JPG, or PDF formats. For PDF files, the system SHALL use `pdfjs-dist` to render the selected page (defaulting to the first page) onto an HTML canvas and extract it as a base64 image data URL before transmitting it to the API.

#### Scenario: User uploads a PNG image
- **WHEN** the user uploads a PNG image file in the BPM Editor import dialog
- **THEN** the system SHALL directly convert the file to a base64 string and display a preview of the source image

#### Scenario: User uploads a PDF document
- **WHEN** the user uploads a PDF file in the BPM Editor import dialog
- **THEN** the system SHALL render the first page to a canvas, convert it to a base64 PNG data URL, and display the preview

### Requirement: Standardized Node Type Mapping via Vision AI
The backend service SHALL invoke the configured multimodal AI model (Gemini Cloud or local Gemma/Qwen-VL) to detect node shapes and map them to the SK-5 Lampiran 3 standard legends:
- Oval / Pill shape -> `start` or `end` node type.
- Standard Rectangle -> `activity` node type.
- Double-bordered Rectangle -> `external-process` node type.
- Blue/Database-marked Rectangle -> `automated-activity` node type.
- Diamond shape -> `decision` node type.
- Wavy-bottomed Rectangle -> `document` node type.
- Inverted Triangle -> `archive` node type.
- Cylinder -> `data-media` node type.
- Small Circle -> `reference` node type.

#### Scenario: AI detects standard shapes from an uploaded flowchart image
- **WHEN** the image is processed by the backend AI parser
- **THEN** the returned JSON SHALL classify each detected node into the corresponding SK-5 node types based on their visual geometry

### Requirement: Structured OCR Response Schema
The backend API endpoint (`/api/bpm/ocr`) SHALL enforce a strict JSON output schema from the AI, returning an object containing `nodes` (with `id`, `type`, `label`, and relative coordinates `x` and `y` normalized between 0 and 1000) and `edges` (with `id`, `source`, `target`, and optional path `label`).

#### Scenario: Successful diagram translation
- **WHEN** the backend receives the base64 image data and processes it
- **THEN** it SHALL return a HTTP 200 response with a JSON payload matching the React Flow schema

### Requirement: Side-by-Side Verification and Commit
The frontend SHALL present a side-by-side verification dialog. The left panel SHALL display the uploaded source image, and the right panel SHALL display an interactive preview of the parsed React Flow diagram, allowing users to rename, re-type, delete nodes/edges, and edit details before saving the diagram to the workspace database.

#### Scenario: User validates and saves diagram
- **WHEN** the user reviews the parsed diagram, adjusts a node label, and clicks "Simpan & Terapkan"
- **THEN** the system SHALL commit the nodes and edges to the active diagram and close the modal
