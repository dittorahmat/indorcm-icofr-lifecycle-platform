## Context

The platform models ICOFR business processes, risks, and controls in BPM and RCM modules. Controls contain regulatory metadata such as `controlType`, `controlNature`, `frequency`, and `applicationId`. Currently, the `/applications` inventory page acts as a flat list without drilldown into associated controls and evidence artifacts. This design outlines how Significant Applications are linked during control editing and how the 6-tab modal on `/applications` delivers live control queries and ITGC domain evidence file libraries.

## Goals / Non-Goals

**Goals:**
- Provide a clean, optional combobox in Control Editor / Regulatory Property Sheet for selecting or creating a Significant Application.
- Ensure control deletion has zero cascade effect on the application inventory (`onDelete: 'set null'`).
- Build an interactive 6-tab modal for application details on `/applications`:
  - Tab 1: Live list of TLC controls linked to this application.
  - Tab 2: Live list of ITGC controls linked to this application.
  - Tab 3-6: ITGC domain document repositories (Access, Changes, Development, Operations) supporting uploads, uploader audit logs, downloads, and interactive previews (PDF, images).
- Support bidirectional jump navigation between the application modal and RCM/BPM views.
- Ensure 100% hybrid runtime compatibility: seamless operation on Cloudflare Workers (R2 Object Storage) and On-Premise / Self-Hosted VPS (Local Disk Storage via `LocalStorageBucket`).

**Non-Goals:**
- Modifying the underlying COSO or SOX testing workflows.
- Automatic document content analysis/indexing for uploaded evidence.

## Decisions

### 1. Control to Application Relationship & Foreign Key Strategy
- **Choice:** Maintain `applicationId` on `controls` and `rcm_controls` referencing `applications.id` with `onDelete: 'set null'`.
- **Rationale:** Deleting a control should never cascade-delete the application entity since an application may be associated with multiple controls or simply represent an IT asset.
- **Alternatives Considered:** Cascade delete (Rejected: would destroy master IT asset inventory).

### 2. Hybrid Storage Architecture (Cloudflare R2 + On-Premise / VPS Local Storage)
- **Choice:** Use the unified `StorageBucket` adapter pattern via `getStorageBucket(c)` in `worker/lib/storage.ts`:
  - **Cloudflare Worker Mode (Demo / Edge):** Automatically binds to `c.env.DOCUMENTS_BUCKET` (R2 Bucket).
  - **On-Premise / VPS Node.js Mode (Production / Self-Hosted):** Automatically falls back to `LocalStorageBucket` storing files under the persistent local directory (`uploads/<orgId>/...`) with path traversal guards and automatic MIME type headers.
- **Metadata Database Table (`application_documents`):**
  - `id` (UUID PK)
  - `organizationId` (FK)
  - `applicationId` (FK -> `applications.id` with cascade on app delete)
  - `itgcArea` (`Access to Program and Data` | `Program Changes` | `Program Development` | `Computer Operations`)
  - `fileName`, `fileUrl`, `fileSize`, `mimeType`
  - `uploadedBy` (FK -> `user.id`), `uploadedAt` (timestamp)
  - `notes` (text)

### 3. Inline Application Creation in BPM/Control Editor
- **Choice:** Use a searchable Combobox with a "+ Add [Name]" footer item that triggers a quick `POST /api/applications` with default active status, then immediately binds the returned `id` to the control.
- **Rationale:** Avoids disrupting the user's flow when mapping controls in BPM.

### 4. File Preview Component
- **Choice:** Interactive dialog viewer:
  - PDFs render via embedded `<iframe src="...">` or blob viewer.
  - Images (PNG, JPG, JPEG, SVG) render via responsive image modal with zoom.
  - Non-viewable files (DOCX, XLSX, ZIP) render a file card with metadata, uploader log, and direct download action.

### 5. Navigation & Jump-to-Context
- **Choice:** When clicking "Lihat di BPM/RCM" from Tab 1 or 2, open via router navigation with state/query params (or in a new tab) so the user retains their context.

## Risks / Trade-offs

- **[Risk] High volume of evidence files across applications** → **Mitigation**: Paginate/limit document list per ITGC area, store binary data via the unified `StorageBucket` (R2 on Cloudflare or local disk on VPS), and store queryable metadata in PostgreSQL.
- **[Risk] Storage directory permissions on On-Premise VPS** → **Mitigation**: `LocalStorageBucket` automatically ensures target directories are recursively created (`fs.mkdir(..., { recursive: true })`) and sanitized against path traversal vulnerabilities.
