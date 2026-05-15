## Context

The current AI Chatbot implementation is a pure RAG (Retrieval-Augmented Generation) system. It searches for relevant text in uploaded PDF documents and provides answers based on that text. However, users frequently need to know about the *actual state* of their ICOFR data: "What are my deadlines?", "Which controls are failing?", "Who is the PIC for this action plan?". 

To solve this, we will implement **Gemini Function Calling (Agentic AI)**, allowing the LLM to request data from the application's database through secure, predefined "tools."

## Goals / Non-Goals

**Goals:**
- Implementation of a Tool Execution layer in `AIService`.
- Development of a suite of "ICOFR Operational Tools" (RCM, BPM, Testing, Remediation).
- Strict RBAC enforcement: AI must never access data the user doesn't have permission to see.
- Temporal and Situational awareness: AI knows the current date, time, and user context.
- Support for "Deep Links" in AI responses to drive user action.

**Non-Goals:**
- Modifying application data via AI (Tools will be Read-Only for now).
- Training a custom model (we use Gemini 2.5 Flash/Lite).
- Complex natural language search for raw transaction details (focused on ICOFR meta-data).

## Decisions

### 1. Tool-Calling Orchestrator (Backend)
We will transition `worker/routes/ai-docs.ts` to use a "loop" pattern for tool execution:
1. Send message to Gemini with tool definitions.
2. If Gemini requests a tool call:
    - Validate permissions.
    - Execute the tool (SQL query via Drizzle).
    - Feed results back to Gemini.
3. Final response generation.

### 2. Secure AI Data Service
A new `AIToolService` (or extension of `AIService`) will contain the actual query logic.
- **Rationale:** Separating query logic from the route makes it easier to test and reuse.
- **Security Wrapper:** Every query will automatically inject `WHERE organization_id = ?` and role-specific filters.

### 3. Context Injection (Frontend -> Backend)
The `AIChatDrawer` will be updated to send:
- `userContext`: { role, level, departmentId }
- `pageContext`: { path, activeEntityId (if any) }
- `temporalContext`: { currentDateTime }

### 4. Tool Categories
- **Discovery Tools:** Search for Controls, Risks, BPM nodes.
- **Progress Tools:** Check CSA/Testing results, Remediation statuses.
- **Metadata Tools:** Get PIC names, Application criticality, SOC report dates.

## Risks / Trade-offs

- **[Risk] Data Overload** → If a tool returns too much data, it will exceed Gemini's context window. 
  - *Mitigation:* Tools will have strict `LIMIT` clauses and summarize data where possible (e.g., "You have 15 overdue tasks" instead of listing all 15 with full details unless asked).
- **[Risk] AI Hallucination with Data** → AI might misinterpret null values or zero results.
  - *Mitigation:* Explicit system instructions on how to handle empty data and the importance of accuracy over guessing.
- **[Risk] Performance (Latency)** → Multi-turn tool calling (AI asks -> Tool runs -> AI responds) adds latency.
  - *Mitigation:* Use `gemini-2.5-flash-lite` for faster inference. Parallelize tool calls if Gemini requests multiple.
- **[Risk] Prompt Injection** → User tries to bypass RBAC via prompt.
  - *Mitigation:* RBAC is enforced at the **Database Query level**, not the Prompt level. The AI *cannot* see data unless the SQL query returns it.
