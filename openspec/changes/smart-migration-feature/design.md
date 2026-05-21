## Context

The current system assumes users will create their ICOFR structure (Accounts, Processes, Risks, Controls) manually within the app. Brownfield BUMNs have years of data in complex, inconsistently formatted Excel files. This design introduces a "Migration Staging Area" that uses AI to bridge the gap between unstructured Excel data and the rigid SK-5/2024 data model.

## Goals / Non-Goals

**Goals:**
- Enable 10-minute migration for massive historical RCM/TB data.
- Automate the mapping of local GLs to Standar FSLI BUMN (SK-164).
- Use AI to populate missing regulatory metadata (Assertions, IPO).
- Establish a legal "System Baseline" via bulk approval.

**Non-Goals:**
- Real-time sync with ERPs (this is about one-time or periodic batch migration).
- Fully automated migration without human oversight (User MUST review flagged AI guesses).

## Decisions

### 1. The Staging Workspace Pattern
Instead of direct database insertion, uploaded data will be stored in a `MigrationSession` temporary storage.
- **Rationale**: Migration data is often dirty. A staging area allows users to "fix" data in a tabular UI that feels familiar (like Excel) before committing to production.
- **Alternatives**: Direct insert with validation errors. Rejected as too high friction for the user.

### 2. Two-Level AI Smart Mapping
To enable unified reporting across the BUMN group, the mapping logic operates at two levels:
- **Level 1: Corporate Setup (Holding)**: When the Parent company uploads the Master COA, the AI performs **Auto-Classification** (e.g., mapping account names to FSLI categories and financial types).
- **Level 2: Data Ingestion (Subsidiary)**: When a subsidiary uploads a local Trial Balance, the AI performs **Semantic Mapping** (matching local account names to the Corporate Master COA created in Level 1).
- **Confidence Scoring**: Both levels use confidence scoring (High/Medium/Low) to flag mappings that require human confirmation in the "Washing Machine" UI.

### 3. Folder Structure & Component Architecture
To maintain project conventions, the code will be organized as follows:
- `src/pages/migration/`: Main entry points.
- `src/pages/migration/components/`: Specific components like `StagingTable`, `CrossCheckPanel`, and `FileUploadZone`.
- `src/pages/migration/hooks/`: Migration-specific logic (e.g., `useMigrationAI`).

### 4. AI Semantic Normalization Engine
Use LLM (GPT-4o or similar) to map free-text fields to system Enums.
- **Example**: Input "Semi-Annually" or "Tiap 6 bln" -> AI output `Semi-Annual`.
- **Confidence Scoring**: The AI will return a confidence score. Scores below 0.8 will be flagged for manual review.

### 3. Bottom-Up Relational Reconstruction (Multi-Entity Aware)
The ingestion engine will automatically traverse the hierarchy for each subsidiary.
- **Logic**: For each row in the uploaded file:
    1. Identify `entityCode`. Route data to the corresponding Organization/Branch.
    2. Extract `Business Process`. If not exists for that entity, create in `bpm_processes` and a placeholder in `bpm_diagrams`.
    3. Extract `Risk`. If not exists, create in `rcms`.
    4. Extract `Control`. Link to the newly created Risk and Process.
- **BPM Smart Backlog**: Migrated risks/controls that haven't been drawn in a flowchart yet will appear in a "Backlog" panel within the `BPMEditor`. Users can drag these items onto the canvas to instantly create nodes with pre-linked regulatory data.


### 6. Financial-Control Cross-Check (The "Intelligence" Layer)
A cross-referencing logic between TB and RCM data.
- **Logic**: Compare `gl_rows` (from TB) with `controls.fsli_codes` (from RCM).
- **Flagging**: 
    - Unmitigated Account: Account > PM but no Controls found.
    - Ghost Control: Control exists for an account that is not in TB or has 0 balance (offered as Qualitative candidate).

### 8. Knowledge Base & Contextual Intelligence
To ensure high-accuracy "guessing", the system will use a local Knowledge Base (KB) built from:
- **Regulation Docs**: SK-5/2024 and SK-164/2021 stored in `/docs`.
- **RCM Library**: Historical examples from the provided Excel templates.
- **Mechanism**: On system startup or migration init, the system will index these documents into a searchable JSON/Vector format to serve as reference for the AI Semantic Mapping.

### 9. Data Safety, Navigation & Localization
- **Unsaved Changes Guard**: The migration staging UI involves heavy user review. We will wrap this workspace with the `useUnsavedChanges` hook to block accidental navigation (internal routing or browser reload) if there are uncommitted AI confirmations.
- **Notification Bell**: Successful completion of the "One-Click Baselining" will trigger a global notification to relevant stakeholders (CFO/Line 2).
- **Localization (i18n)**: All new UI strings, AI hints, and warning messages will be strictly localized using `react-i18next` with dictionary entries in both `en` and `id` locales.
- **Sidebar Integration**: The entry point will be seamlessly integrated into the existing Sidebar navigation structure.

## Risks / Trade-offs

- **[Risk] AI Hallucination in Assertions** → [Mitigation] UI will use distinct visual cues (orange background) for AI-guessed fields, requiring the user to "Accept" or "Correct" before finalization.
- **[Risk] Mapping Mismatches** → [Mitigation] Provide a "Template Download" that users can use to pre-format their data if the AI-assisted mapper fails for their specific structure.
