---
title: Fix AI CSA Schedule Date Format Error
status: active
---

## Problem
When a user uses the AI chatbot to create a CSA schedule, they encounter an "e.toISOString is not a function" error in the UI after confirming the action. This prevents the CSA schedule from being created.

## Cause
The AI Tool Executor (`worker/services/ai/tool-executor.ts`) returns a Date object in its response data for `plannedDate` when generating the `CREATE_SCHEDULE` action intent. However, this payload goes across an API boundary.
In `worker/routes/ai-docs.ts`, when the action is confirmed, it attempts to insert this data directly into the database.
The `api` fetch wrapper in `api-client.ts` or the way `JSON.stringify` works across the boundary means `plannedDate` arrives as a string, but the Drizzle schema or Postgres insertion process might be trying to call `.toISOString()` on a string, OR the frontend is trying to call `.toISOString()` on a string when preparing the request body.

Looking at `AIChatDrawer.tsx` line 145:
`actionConfirmation: pendingAction`
It is sending the `pendingAction` object back. `pendingAction.data.plannedDate` was a Date object on the server, got JSON stringified to the client (so it is now a string), and is being sent back as a string.
Then in `worker/routes/ai-docs.ts`, it does `await db.insert(csaSchedules).values(data);` where `data.plannedDate` is a string instead of a Date object. Drizzle pg expects a Date object for `timestamp` fields.

Wait, the error happens on the FRONTEND (as seen in the chat UI). `e.toISOString is not a function` is likely thrown during the API call or right before it.
When the user says "Ya, setuju. Lanjutkan.", `AIChatDrawer.tsx` sends `actionConfirmation` to `/api/ai/chat` via `api-client`. The body is JSON stringified. The date object inside `data.plannedDate` becomes a string (`"2026-07-10T00:00:00.000Z"`).
In `worker/routes/ai-docs.ts` (line 225), it receives this data from the request body. Because it comes from `await c.req.json()`, `data.plannedDate` is a STRING.
It then passes it directly to `db.insert(csaSchedules).values(data)`. `drizzle-orm` PG dialect or PG driver might try to parse it, but if it fails or throws, we would see a backend error. WAIT.
If the error is thrown IN THE BROWSER, it means the browser is trying to call `toISOString()` on something that is not a Date.

Ah!
`worker/services/ai/tool-executor.ts` lines 284-288:
```typescript
      data: {
        id: crypto.randomUUID(),
        organizationId: ctx.orgId,
        bpmProcessId: processId,
        type,
        plannedDate: new Date(plannedDate),
        assignedTo: assignedTo || ctx.userId,
        status: "Not Started"
      },
```

This returns an object where `plannedDate` is a `Date` object.
When this object is sent as JSON via `c.json()` or `ok(c, ...)` from `/api/ai/chat`:
The browser `api-client.ts` or React state receives it as a JSON-parsed object, so `plannedDate` is a **STRING** (ISO format).
When the user confirms the action, `AIChatDrawer.tsx` does:
`handleSend("Ya, setuju. Lanjutkan.", pendingAction);`
This calls `api("/api/ai/chat", { body: JSON.stringify({ actionConfirmation: pendingAction, ... }) })`
Because `pendingAction.data.plannedDate` is a string, and not a Date object, if Drizzle tries to insert it directly as a string, it might fail. But wait, `e.toISOString is not a function` usually happens when some code specifically does `e.toISOString()` expecting `e` to be a Date object.
It is not the frontend calling toISOString.
Wait, drizzle ORM does date serialization under the hood. Let us check `node_modules/drizzle-orm` or the worker schema.
In `worker/db/schema.ts`, `plannedDate` on `csaSchedules` is defined as `timestamp("planned_date").notNull()`.
When `db.insert(csaSchedules).values({ ...data })` is called with `data.plannedDate` being a STRING, Drizzle-ORM/node-postgres might attempt to format it as a database date, and it might call `.toISOString()` internally on the parameter assuming it is a JavaScript `Date` object.

Yes! If Drizzle pg dialect expects a `Date` object for a `timestamp` column but receives a string, its parameter mapper might do `value.toISOString()` and throw `e.toISOString is not a function` (where `e` is the string).
## Proposed Solution
In `worker/routes/ai-docs.ts` around line 224, where it handles the `CREATE_SCHEDULE` action, we need to convert the `plannedDate` from a string back into a `Date` object before inserting it into the database.

```typescript
  // Handle direct action confirmation (Agentic Action)
  if ((body as any).actionConfirmation) {
    const { action, data } = (body as any).actionConfirmation;
    const db = getDb(c.env.DATABASE_URL);
    if (action === "CREATE_SCHEDULE") {
      // Fix: convert plannedDate string back to Date object
      if (data.plannedDate && typeof data.plannedDate === "string") {
        data.plannedDate = new Date(data.plannedDate);
      }
      await db.insert(csaSchedules).values(data);
      return ok(c, { success: true, message: "Jadwal berhasil dibuat." });
    }
  }
```
