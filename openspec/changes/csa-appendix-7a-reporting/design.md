## Context

Digital CSA assessments need to be transformed into formal documents (Lampiran 7a) for regulatory compliance and physical signing if necessary. The system needs to bridge the gap between structured JSON data and formatted PDF reports while providing a standard procedure library and professional branding.

## Goals / Non-Goals

**Goals:**
- Provide automated PDF generation for Appendix 7a (Detailed & Summary).
- Support master data for "Standard Test Procedures" per process.
- Auto-populate test procedures when starting a new CSA.
- Ensure document integrity with QR code placeholders.
- Apply consistent company branding (logo, name) in report headers.

**Non-Goals:**
- Redesigning the entire BPM visual editor.
- Implementing a full document management system (DMS).

## Decisions

### 1. Schema Expansion
- **Table `bpm_processes`**: Add `standard_test_procedure` (text).
- **Table `csa_records`**: Add `test_procedure` (text) and `archive_location` (text).
- **Rationale**: Storing the snapshot of the procedure at the time of assessment is critical for audit integrity, even if the "Standard" changes later.

### 2. PDF Generation & Branding Strategy
- **Decision**: Use a "Hidden React Printing" approach with `react-to-print` or a dedicated layout component styled with standard CSS.
- **Branding**: Contek logic from `BPMCanvasHeader` to fetch `settings.logoUrl` and `settings.companyName`.
- **Rationale**: This allows high-fidelity matching of the regulatory Excel/Word templates using Tailwind CSS, ensuring the "rapi" (neat) requirement is met while maintaining brand consistency.
- **Layouts**:
  - `DetailedLayout`: Includes branded header + sample matrix + procedure narasi + footer.
  - `SummaryLayout`: Includes branded header + result summary + procedures + footer (omits sample rows).

### 3. Procedure Maintenance UI
- **Decision**: Integrate procedure editing into the **Worksheet** view of each process.
- **Rationale**: This is where Lini 2 / Compliance managers already work to define risks and controls. Adding procedures here keeps the workflow centralized.

### 4. Localization
- **Decision**: All report headers, labels, and static text must be pulled from `id/csa_hub.json` and `en/csa_hub.json`.
- **Rationale**: Standardizes terminology like "Kertas Kerja", "Prosedur Uji", and "Simpulan Efektivitas".

## Risks / Trade-offs

- [Risk] Large matrix reports (50 samples x 10 controls) might break PDF paging. → [Mitigation] Use page-break-inside avoid CSS rules and grouped headers.
- [Risk] Performance of fetching procedures for every worksheet row. → [Mitigation] Only fetch standard procedure when explicitly editing or starting a CSA.
