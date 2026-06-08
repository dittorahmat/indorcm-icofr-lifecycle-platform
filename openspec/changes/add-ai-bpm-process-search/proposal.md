---
title: Add AI BPM Process Search Tool
status: active
---

## Problem
The AI chatbot currently lacks a tool to search for BPM processes by name. This forces the AI to ask the user for a manual Process ID when performing actions like scheduling CSA, which is a poor user experience for an agentic AI.

## Proposed Solution
1. Define a new tool `search_bpm_processes` in `worker/services/ai/tool-definitions.ts`.
2. Implement the tool in `worker/services/ai/tool-executor.ts` to query the `bpmProcesses` table using fuzzy/ILike matching on the name.
3. Update the AI system instruction if necessary, though the model should discover the new tool automatically.
