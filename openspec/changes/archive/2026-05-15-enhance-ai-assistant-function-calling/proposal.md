## Why

Current AI Chatbot is limited to static knowledge retrieval (RAG) from uploaded documents. To become a true "Operational Assistant," the AI must be aware of live application data, user context, and organizational progress across the ICOFR lifecycle (RCM, BPM, TOE, TOD, Remediation). This change enables the AI to answer practical questions about deadlines, missing evidence, and cross-phase data analysis.

## What Changes

- **AI Function Calling Infrastructure**: Transition the backend from simple prompt engineering to a Tool Use/Function Calling architecture using Gemini API.
- **Context-Aware System Instructions**: Inject dynamic user profile (Role, Department, Current Page) and temporal context (Current Date/Time) into the LLM prompt.
- **ICOFR Data Tools**: Implementation of secure, read-only backend functions for AI to query:
    - RCM/BPM mappings and diagram flows.
    - TOE/TOD testing history and 6-pilar evaluations.
    - CSA schedules and evidence collection status.
    - Remediation action plans and deadlines.
- **Deep Linking**: AI will be able to generate direct links to specific records (e.g., link to a specific CSA execution page) in its responses.

## Capabilities

### New Capabilities
- `ai-agentic-assistant`: Core capability for the AI to interact with the system via function calls and tools.

### Modified Capabilities
- `csa-management`: AI will now be able to query CSA records and provide status updates.
- `remediation-tracking`: AI will now be able to query action plans and notify about deadlines.

## Future Capabilities (Out of Scope for MVP)
To ensure a focused initial release, the following tools for other ICOFR phases are deferred to future updates. They are documented here for future reference:
- **Scoping & Materiality**: `get_scoping_summary` (OM/PM thresholds) and `list_significant_accounts` (GL accounts above PM).
- **ITGC & SOC**: `get_soc_reports_status` (vendor SOC expiry dates) and `get_critical_applications` (ITGC pending applications).
- **Aggregate & Reporting**: `check_signoff_readiness` (Line 2 validation completeness) and `generate_management_summary` (drafting effectiveness conclusions).

## Impact

- **Backend (`worker/routes/ai-docs.ts`)**: Transformation of the chat endpoint to support function definitions and tool execution.
- **AI Service (`worker/services/ai-service.ts`)**: New service layer to handle database queries requested by the AI.
- **Frontend (`src/components/ai-chatbot/AIChatDrawer.tsx`)**: Minor updates to handle context passing and potential tool output formatting.
- **Security**: Strict RBAC enforcement within tool execution to prevent data leakage between users.
