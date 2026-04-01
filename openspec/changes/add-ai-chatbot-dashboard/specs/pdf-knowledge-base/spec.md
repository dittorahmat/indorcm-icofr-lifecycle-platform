## ADDED Requirements

### Requirement: PDF Text Extraction

Sistem SHALL extract text dari PDF regulasi SK-5/DKU.MBU/11/2024 untuk digunakan sebagai knowledge base.

**Source File**: `2024peraturan tk eselon i005.pdf` (119 halaman)

**Extraction Method**: Python script dengan pdfplumber library

**Output**: 
- `worker/knowledge-base.ts` - TypeScript file dengan exported constant
- Format: Plain text string

**Extraction Process:**
```python
import pdfplumber
with pdfplumber.open("2024peraturan tk eselon i005.pdf") as pdf:
    full_text = "\n".join([page.extract_text() for page in pdf.pages])
```

#### Scenario: PDF text extracted
- **WHEN** build process dijalankan
- **THEN** sistem extract text dari PDF dan save sebagai TypeScript constant

#### Scenario: Extraction失败
- **WHEN** PDF file tidak ditemukan atau corrupt
- **THEN** build process gagal dengan error message yang jelas

### Requirement: Knowledge Base Format

Sistem SHALL menyimpan extracted PDF text dalam format yang optimal untuk Gemini API context.

**Structure:**
```typescript
export const ICOFR_KNOWLEDGE_BASE = `
Dokumen: SK-5/DKU.MBU/11/2024
Judul: Petunjuk Teknis Pengendalian Internal atas Pelaporan Keuangan (ICOFR)
Tanggal: 11 November 2024

[CONTENT]
...
`;
```

**Metadata Included:**
- Document title
- Document number (SK-5/DKU.MBU/11/2024)
- Issue date
- Full text content

**Content Preservation:**
- Maintain BAB structure (BAB I, BAB II, etc.)
- Preserve Pasal numbering
- Keep table data readable
- Maintain formatting (bold, lists) jika memungkinkan

#### Scenario: Knowledge base loaded
- **WHEN** worker starts
- **THEN** sistem load knowledge base ke memory

#### Scenario: Content structure preserved
- **WHEN** AI ditanya tentang BAB tertentu
- **THEN** AI dapat reference struktur yang benar

### Requirement: Context Injection

Sistem SHALL inject knowledge base sebagai system context ke Gemini API setiap request.

**System Prompt Template:**
```
Anda adalah Asisten AI ICOFR. Jawab pertanyaan berdasarkan dokumen berikut:

--- DOKUMEN ICOFR ---
{ICOFR_KNOWLEDGE_BASE}
--- END DOKUMEN ---

Instruksi:
1. Jawab hanya berdasarkan dokumen di atas
2. Sebutkan BAB dan Pasal jika relevan
3. Gunakan Bahasa Indonesia
4. Jika pertanyaan tidak terkait ICOFR, tolak dengan sopan
```

**Token Management:**
- Knowledge base: ~50K tokens (234K chars)
- Gemini 2.5 Flash Lite context window: ~1M tokens
- Remaining tokens untuk conversation: ~950K tokens (ample space)

#### Scenario: Context injected
- **WHEN** API request ke Gemini
- **THEN** knowledge base included dalam system prompt

#### Scenario: AI reference dokumen
- **WHEN** user tanya tentang regulasi
- **THEN** AI jawab dengan reference ke dokumen yang di-inject

### Requirement: Knowledge Base Updates

Sistem SHALL support update knowledge base ketika regulasi berubah.

**Update Process:**
1. Replace PDF file di root directory
2. Re-run extraction script: `python extract_full_pdf.py`
3. Commit generated `worker/knowledge-base.ts`
4. Deploy ulang worker

**Version Tracking:**
- Comment di `knowledge-base.ts` dengan timestamp extraction
- Git commit message yang jelas

#### Scenario: Knowledge base updated
- **WHEN** regulasi baru dirilis
- **THEN** sistem dapat di-update dengan PDF baru

#### Scenario: Multiple documents (future)
- **WHEN** perlu tambah dokumen lain
- **THEN** sistem dapat concatenate multiple PDFs
