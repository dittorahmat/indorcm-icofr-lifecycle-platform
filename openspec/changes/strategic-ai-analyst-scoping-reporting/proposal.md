## Why

While the AI Assistant can now retrieve documents and query live data, it still operates in silos. Strategic decisions in ICOFR require "Top-Down" awareness—connecting financial materiality (Scoping) with operational failures (Testing/Deficiencies). This change introduces a Strategic AI Analyst capable of cross-module reasoning, fraud awareness through WBS integration, and narrative assistance for audit justifications, transforming the AI from a data retriever into a proactive advisor.

## What Changes

- **Strategic AI Tools**: Implementation of advanced tools to bridge Scoping and Reporting:
    - `get_icofr_executive_summary`: Combines Materiality thresholds with current deficiency status.
    - `check_year_end_readiness`: Analyzes if all "Significant Accounts" have effective testing results.
    - `calculate_deficiency_magnitude`: Automatically compares exposure values against active PM (Performance Materiality).
- **Cross-Module Reasoning (The Glue)**: Update the LLM system prompt and tool orchestration to allow multi-step logic across Scoping, RCM, and Testing.
- **WBS & Fraud Integration**: Connect the AI to Whistleblowing Recap data to identify fraud-related risks in the process flow.
- **Narrative Assistance Engine**: AI-powered drafting for:
    - CSA Ineffective Rationale.
    - Homogeneity Justifications for sampling.
- **Agentic Action (Experimental)**: Introduction of write-enabled tools allowing AI to perform operations like scheduling tasks or assigning PICs.

## Capabilities

### New Capabilities
- `strategic-ai-analyst`: Core intelligence for cross-module reasoning and executive summaries.
- `ai-wbs-integration`: Ability to analyze fraud indicators from WBS within the ICOFR context.
- `ai-narrative-assistance`: Generative assistance for regulatory rationales and audit notes.
- `ai-agentic-action`: Operational capability to modify system state (e.g., creating schedules).

### Modified Capabilities
- `ai-agentic-assistant`: Extending the existing agent with advanced strategic logic.

## Impact

- **Backend (`worker/services/ai/tool-executor.ts`)**: Addition of complex, multi-table join queries and write operations.
- **LLM Prompting**: Significant update to system instructions to handle "Analyst" persona and cross-module context.
- **Database**: Access to `gl_rows`, `simulations`, `notifications`, and `wbs` related data for the AI service.
- **Security**: Granular permission checks for Materiality data (OM/PM) to ensure Lini 1 users cannot access sensitive strategic thresholds.
