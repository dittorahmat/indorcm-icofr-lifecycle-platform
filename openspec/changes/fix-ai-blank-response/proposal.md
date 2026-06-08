---
title: Fix Blank AI Chat Response After Confirmation
status: active
---

## Problem
The AI chatbot displays a blank response bubble after a user successfully confirms a scheduled action.

## Cause
The `/api/ai/chat` endpoint returns `{ success: true, message: "..." }` on action confirmation, but `AIChatDrawer.tsx` expects the AI response text to be under the `response` property (`response.response`).

## Proposed Solution
Modify `worker/routes/ai-docs.ts` to return `{ success: true, response: "..." }`.
