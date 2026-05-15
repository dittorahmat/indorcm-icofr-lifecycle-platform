## Context

The current AI implementation serves as an operational aid. However, the true value of AI in GRC lies in its ability to correlate disparate data points—specifically linking financial significance (Scoping) to operational health (Testing). This design moves the AI into a "Strategic Analyst" role by providing it with the necessary data hooks to perform cross-module reasoning.

## Goals / Non-Goals

**Goals:**
- Bridge Scoping and Reporting modules via unified AI tools.
- Implement "Analyst" persona with cross-module reasoning capabilities.
- Automate quantitative severity assessment for deficiencies.
- Provide draft narrative assistance for complex audit justifications.
- Scaffold "Agentic Action" (Write-tools) for scheduling.

**Non-Goals:**
- Real-time accounting reconciliation (this is meta-data analysis, not bookkeeping).
- Replacing manual sign-off (AI assists, user approves).
- Modifying security settings or user roles via AI.

## Decisions

### 1. Cross-Module Aggregator Layer
We will create a `StrategicAnalystService` (within `worker/services/ai/`) that performs complex joins between `gl_rows`, `simulations`, `test_records`, and `deficiencies`.
- **Rationale:** Keeps the core `AIToolExecutor` clean by delegating strategic logic to a specialized service.

### 2. Tiered Materiality Visibility
Materiality thresholds (OM/PM) from the `simulations` table will be masked/filtered in tool outputs if the requesting user's role is `Line 1`.
- **Rationale:** Compliance with confidentiality standards where only Lini 2/3 and Management should see sensitive materiality calculations.

### 3. Generative Narrative Engine
Instead of just returning data, the AI will use "few-shot" examples in its system instructions to learn the tone and structure of "Good" rationales for Ineffective controls and Homogeneity justifications.

### 4. Agentic Action Protocol (Write-Tools)
We will implement a confirmation loop for "Write" operations:
1. AI requests `create_schedule`.
2. Backend returns a `pending_action_token`.
3. Frontend prompts user: "AI wants to create a schedule. Approve?".
4. If approved, the write operation is committed.

## Risks / Trade-offs

- **[Risk] logic Overlap** → AI might duplicate logic already existing in the "Asesmen Manajemen" dashboard.
  - *Mitigation:* The AI tools will call the same underlying utility functions used by the dashboard to ensure consistency.
- **[Risk] Sensitive Data Exposure** → AI accidentally revealing OM/PM to unauthorized users.
  - *Mitigation:* Hardcoded role-check in `get_icofr_executive_summary` before returning simulation data.
- **[Risk] Hallucination in Narratives** → AI suggesting incorrect audit justifications.
  - *Mitigation:* Every AI-generated narrative MUST be clearly marked as a "DRAFT" with a "Review & Edit" requirement before saving.
