## Context

See proposal.md for motivation and problem background. Currently, `createNotificationAndSendEmail` in `worker/services/email.ts` writes directly to the `notifications` table and sends SMTP email if configured. System-wide workflows (CSA assignments, scoping approvals, remediation action plans) call this function.

## Goals / Non-Goals

**Goals:**
- Provide a provider-agnostic `NotificationChannelAdapter` architecture supporting:
  1. In-App (platform database & notification center).
  2. Email (SMTP / Resend fallback).
  3. Slack Incoming Webhook (formatted blocks).
  4. Microsoft Teams Incoming Webhook (MessageCard / Adaptive Cards).
  5. Generic Webhook (standard REST/JSON payload for Discord, n8n, Zapier, or custom internal endpoints).
- Allow Organization Admins to configure and test Slack, Teams, and Generic Webhooks via `/admin/settings`.
- Allow Individual Users to select their preferred delivery channels (In-App, Email, Slack, Teams, Generic Webhook).
- Ensure authorization and fail-graceful execution (external webhook failures never break core business logic).

**Non-Goals:**
- Two-way interactive bot chat commands. This solution is focused on outgoing dispatch.

## Decisions

### 1. Provider-Agnostic Adapter Registry
- Standardized `UnifiedNotificationPayload` structure (title, message, type, link, recipient, eventName, metadata).
- Adapter registry sorts channels and evaluates `isEnabled()` on each adapter (In-App, Email, Slack, MS Teams, Generic Webhook).

### 2. Schema and Persistence
- Extend `organization_settings` / `Settings` with:
  - `slackWebhookUrl`, `msTeamsWebhookUrl`, `genericWebhookUrl`
  - `slackEnabled`, msTeamsEnabled`, `genericWebhookEnabled`
- Extend `user` table with `notificationPreferences` (JSONB settings defaulting to true).

### 3. Resilient Dispatching
- Execute dispatches using `Promise.allSettled` with a strict 5000ms timeout per request.

## Risks / Trade-offs

- [Risk] External webhooks slowing down requests → Mitigation: 5000ms timeout and non-blocking execution.
- [Risk] Sensitive webhook URLs → Mitigation: Only Admin/CFO roles can access or edit webhook settings.
