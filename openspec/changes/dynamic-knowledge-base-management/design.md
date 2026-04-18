## Context

The current system relies on a hardcoded constant `ICOFR_KNOWLEDGE_BASE` in `worker/knowledge-base.ts`. This document is a plain text extraction of one regulation. The goal is to allow users to upload multiple documents, categorize them, and restrict access based on the user's department and role.

## Goals / Non-Goals

**Goals:**
- Provide a UI for managing Internal (SOP) and External (Regulation) documents.
- Store PDF files in Cloudflare R2 and metadata in PostgreSQL (Drizzle).
- Extract text from PDFs on the server-side during the upload process.
- Implement role-based knowledge isolation for AI Chat:
    - Line 1: Can only "see" External docs + Internal docs matching their `departmentId`.
    - Line 2/3/Admin: Can see all documents.
- Allow linking documents to GL accounts and FSLI categories for improved AI context retrieval.

**Non-Goals:**
- Advanced OCR for scanned/image-based PDFs (only text-based PDFs supported for now).
- Implementing a full Vector Database (Vectorize) unless context window limits are exceeded (sticking to filtered text injection).
- Version control for documents (only current version is stored).

## Decisions

### 1. Database Schema (Drizzle)
We will introduce a `documents` table and three junction tables to handle many-to-many relationships with Departments, GL Accounts, and FSLI.
- **Why**: A single SOP often affects multiple departments or financial accounts. Relational mapping allows for precise context filtering.

### 2. File Storage (Cloudflare R2)
We will use Cloudflare R2 to store the raw PDF files.
- **Why**: R2 is natively integrated with Workers and provides a cost-effective way to store binary assets compared to keeping them in the database.

### 3. Server-Side PDF Extraction
We will use a lightweight JavaScript-based PDF parser (e.g., `unpdf`) within the Worker.
- **Why**: Ensures consistency between the uploaded file and the knowledge base. User doesn't need to manually copy-paste text.

### 4. Dynamic Prompt Construction
Instead of a static `${ICOFR_KNOWLEDGE_BASE}`, the AI chat route will:
1. Fetch relevant `document_id`s based on user role/dept.
2. Join with the `documents` table to retrieve text content.
3. Inject the aggregated text into the system prompt.

## Risks / Trade-offs

- **[Risk] Worker Memory Limits**: Extracting text from very large PDFs might exceed the 128MB/256MB memory limit of a Cloudflare Worker.
  - **Mitigation**: Implement a 5MB size limit for uploads and perform extraction in a "short-lived" way.
- **[Risk] Context Window Overload**: If a user has access to dozens of large SOPs, the text might exceed the Gemini model's context window.
  - **Mitigation**: For the MVP, we will prioritize External docs + Dept-specific Internal docs. If needed, we will implement simple keyword-based truncation.
- **[Risk] Storage/DB Desync**: A database write might fail after an R2 upload.
  - **Mitigation**: Perform R2 upload first, then DB write. If DB fails, attempt to delete R2 file or mark as "Orphaned" for cleanup tasks.
