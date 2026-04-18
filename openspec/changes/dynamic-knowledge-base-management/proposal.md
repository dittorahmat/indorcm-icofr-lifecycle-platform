## Why

Currently, the AI knowledge base is static and hardcoded in `worker/knowledge-base.ts`, which prevents real-time updates and lacks role-based access control. Users in Line 1 (Operational) require access only to relevant SOPs for their department, while Line 2/3 and Admin roles need broader access. Moving to a dynamic, database-driven system with PDF support ensures the platform remains current, compliant, and secure.

## What Changes

- **New Document Management UI**: A dedicated "Dokumen Terkait" page with two tabs: Internal (SOPs) and External (Regulations/Laws).
- **Metadata-Rich Tagging**: Capability to link documents to multiple Departments, GL Accounts, and FSLI items.
- **Dynamic AI Knowledge Retrieval**: The AI chat will no longer use a static file. Instead, it will perform context-aware retrieval based on the user's role and department.
- **Server-Side PDF Processing**: Automated text extraction from uploaded PDF files within the Cloudflare Worker environment.
- **Role-Based Isolation**: 
    - **Line 1**: Access restricted to External documents + Internal documents matching their department.
    - **Line 2/3/Admin**: Global access to all documents.
- **Storage Integration**: Full lifecycle management of document files in Cloudflare R2, synchronized with database metadata.

## Capabilities

### New Capabilities
- `document-management`: Core CRUD for documents, including metadata mapping (Dept/GL/FSLI) and R2 storage sync.
- `ai-dynamic-knowledge`: Logic for filtering and injecting relevant document text into the AI chat prompt based on user context.

### Modified Capabilities
- `ai-chatbot`: Updating the requirement to use dynamic, filtered knowledge base instead of the static `ICOFR_KNOWLEDGE_BASE`.

## Impact

- **Database**: New tables in `worker/db/schema.ts` for documents and their relations.
- **API**: New endpoints for uploading, listing, and deleting documents.
- **Worker**: Update to `worker/user-routes.ts` for chat logic; addition of PDF parsing logic.
- **Storage**: Configuration of Cloudflare R2 bucket.
- **Frontend**: New page and components for document management.
