# Dedicated AI Suggest Endpoint for BPM Risk/Control

Suggestion popover in BPM node property sheets calls a dedicated `POST /api/ai/suggest-risk-controls` with an SK-5-locked prompt and a fixed `{items: [{description, rationale}]}` contract, instead of reusing the generic `POST /ai/chat` RAG chatbot.

## Considered Options

- Reuse `/ai/chat`: no new route, but responses are conversational markdown, need RAG retrieval per call, and share chat semantics (tools, history) that suggestions don't need.
- Dedicated endpoint (chosen): structured `responseSchema` output, no retrieval latency, own validation (`RISK_REQUIRED`, `INVALID_SUGGEST_REQUEST` via `AppError`), same 100/day rate-limit store pattern.

## Consequences

- Pure logic lives in `worker/services/ai/suggest-risk-controls.ts` with the LLM injected, so the contract is unit-tested without an API key; the response shape matches future Risk Library (Lampiran 2) rows so a library provider can plug in later without UI changes.
