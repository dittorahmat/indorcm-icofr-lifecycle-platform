## 1. Backend Strategic Layer

- [x] 1.1 Implement `StrategicAnalystService` in `worker/services/ai/`.
- [x] 1.2 Implement tiered security filtering for OM/PM visibility in tool responses.
- [x] 1.3 Update LLM System Prompt with "Analyst" persona and cross-module reasoning logic.

## 2. Analyst Tools Implementation

- [x] 2.1 Implement `get_icofr_executive_summary` tool.
- [x] 2.2 Implement `check_year_end_readiness` tool with cross-module joins.
- [x] 2.3 Implement `calculate_deficiency_magnitude` based on active simulation PM.

## 3. WBS & Narrative Engine

- [x] 3.1 Implement `get_wbs_fraud_indicators` tool.
- [x] 3.2 Implement `draft_audit_narrative` tool with few-shot prompting for rationales.
- [x] 3.3 Implement `draft_homogeneity_justification` tool.

## 4. Agentic Action (Write-Tools)

- [x] 4.1 Implement `create_csa_schedule` write-enabled tool.
- [x] 4.2 Implement the "Pending Action" confirmation loop in the backend.
- [x] 4.3 Update `AIChatDrawer.tsx` to handle user confirmation for write actions.

## 5. Validation & UAT

- [x] 5.1 Verify multi-step reasoning (Scoping -> Testing) via chat tests.
- [x] 5.2 Verify security masking: Ensure Line 1 users cannot query OM/PM values.
- [x] 5.3 Verify narrative quality: Ensure AI-generated drafts follow SK-5 terminology.
