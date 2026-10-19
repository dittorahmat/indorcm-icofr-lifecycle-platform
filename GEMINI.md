# IndoGRC Pro — ICOFR Lifecycle Platform

**Read `AGENTS.md` and `docs/agents/guardrails.md` before your first change.**
They are the only source of truth for mandates, gates, and conventions.

This file is a pointer by design. It used to carry its own copy of the mandates,
and the copy drifted: it still computed LOC with raw `Measure-Object -Line`
(after the rule moved to non-empty lines), it omitted the heavy-CLI guard, and
it predated the guardrails index. Two copies produce two answers, so this one
holds no rules.

    AGENTS.md                    project mandates, stack, directory map, smell catalog
    docs/agents/guardrails.md    every gate: command, base, scope, exemptions
    docs/agents/heavy-cli.md     Windows: redirect type-check/lint/build/test output first
