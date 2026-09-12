## 1. Database & Types Schema

+ [x] 1.1 Update `shared/types.ts` to include webhook configurations (slackWebhookUrl, msTeamsWebhookUrl, genericWebhookUrl, slackEnabled, msTeamsEnabled, genericWebhookEnabled) and user notification preferences (inApp, email, slack, msTeams, genericWebhook). Verify with `npm run type-check`.
- [x] 1.2 Extend `worker/db/schema.ts` for organization webhook fields and user notification preferences. Verify database types match.

## 2. Backend Provider-Agnostic Notification Dispatcher

- [x] 2.1 Implement Provider-Agnostic `NotificationChannelAdapter` registry in `worker/services/notifications/~ with adapters for In-App, Email, Slack, MS Teams, and Generic Webhook (Discord/n8n compatible).
-  [x] 2.2 Add API endpoint `/api/settings/test-webhook` to allow admins to test Slack, MS Teams, and Generic Webhooks. Verify via unit test.
-  [x] 2.3 Add API endpoints for user notification preferences (GET/PUT `/api/users/me/notification-preferences`).
-  [x] 2.4 Refactor existing `createNotificationAndSendEmail` calls across the codebase to dispatch via the new unified dispatcher. Verify callees work as expected.

## 3. Frontend UI Integration & Localization

- [x] 3.1 Update `src/pages/admin/SettingsPage.tsx` with a Webhook Integrations section supporting Slack, MS Teams, and Generic Webhooks with "Test Webhook" actions.
-  [x] 3.2 Add a User Notification Preferences component (in `NotificationsPage.tsx` and/or profile modal) with toggles for In-App, Email, slack, MS Teams, and Generic Workflows.
-  [x] 3.3 Add i18n localization keys (Indonesian & English) for all new webhook fields, preferences, and alerts.

## 4. Verification & Testing

-  [x] 4.1 Write unit tests for Slack, Teams, and Generic Webhook adapter payload formatting and recipient filtering.
-  [x] 4.2 Run full validation suite (`type-check`, `lint`, `test`, `build`) to ensure zero regressions.
