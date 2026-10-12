# ADR 0007: Portable AI Cache over Provider-Native Prompt Cache

## Status
Accepted

## Context
Grill session 2026-10-12 settled 8x Ya: AI capabilities cover `POST /ai/suggest-risk-controls` (SK-5-locked prompt) and `POST /ai/chat` (RAG + 3-turn tool loop), plus repeated `generateEmbedding` and `hybridSearch` costs. Demo runs on Gemini, but on-premise deployments will use different models (Ollama/vLLM), so provider-native prompt caching alone is not portable.

## Decision
Default to portable app-side AI Response Cache + AI Embedding Cache in Postgres (`ai_cache_entries` per `organizationId` + prompt hash; TTL 1h suggest / 30m chat), keyed to Knowledge Base version + active Approved simulation. Provider-native prefix caching (e.g. Gemini `cachedContent`) lives behind the `AiCache` seam in `AIService` as an optional adapter that may no-op.

## Considered Options
- Provider-native only (Gemini `cachedContent` / OpenAI cached tokens): cheapest on demo, but breaks on provider swap and covers neither embedding nor retrieval costs.
- App-side only without seam: portable but leaves provider free-lunch caching on the table.
- Chosen split (portable default + optional adapter): pays one abstraction to keep both portability and future provider wins.

## Consequences
- Cache hits must still write `auditTrail`/`ChangeLog` with `cacheHit: true`; invalidation on `documents` change or new Approved simulation prevents stale OM/PM.
- Frontend TanStack Query cache (`AiSuggestionPopover`, 30m stale) stays as client layer; server cache is authoritative per `orgId`.
- Rujukan: `GLOSSARY.md` (`AI Response Cache`, `AI Embedding Cache`, `Provider Prompt Cache Adapter`), `docs/adr/0004-ai-risk-control-suggest-endpoint.md`, `worker/services/ai-service.ts`, `worker/routes/ai-docs.ts`, `worker/routes/ai-suggest.ts`.
