## Why

Currently, IndoGRC Pro notifications are primarily delivered in-app (to the notification center database) with basic SMTP email fallback. In enterprise BUMN compliance workflows (SK-5/DKU.MBU/11/2024), critical action itemsâ€”such as CSA sign-offs, remediation action plans, and scoping approvalsâ€”require timely awareness across modern team communication channels.

Furthermore, different employees prefer different channels (e.g. email, Slack, MS Teams, or in-app only), while organizations require central control over webhook integration credentials without individual users leaking webhook URLs.
3 What Changes

- **Multi-Channel Notification Dispatcher**: Refactor single-target notification dispatcher into an extensible, resilient multi-channel dispatcher supporting In-App, Email (SMTP), Slack (Incoming Webhooks), and Microsoft Teams (Incoming Webhooks).
-&ª*Organization Webhook Integrations (Admin Settings)**: Add settings in Admin Settings (`/admin/settings`) to configure and test Slack Incoming Webhook URL and Microsoft Teams Webhook URL.
- **User Notification Channel Preferences**: Allow users in their profile / preference modal or `/notifications` to choose which notification channels they wish to receive alerts on (`inApp`, `email`, `slack`, `msTeams`).
- **Graceful Failure & Resilient Delivery**: Webhook and email dispatching fail gracefully without blocking core HTTP API operations or rolling back internal database mutations.

## Capabilities

### Modified Capabilities
- `compliance-notification-system`: Expand notification delivery to support multi-channel distribution (Slack, MS Teams, Email, In-App), user channel preferences, and organizational webhook settings.

## Impact

- **Database**:
  - Update `user` table or user settings to store user channel preferences (`inApp`, `email`, `slack`, `msTeams`).
  - Update `organization_settings` / `Settings` schema to store `slackWebhookUrl`, `msTeamsWebhookUrl`, `slackEnabled`, `msTeamsEnabled`.
-&ª*Backend API**:
  - Update notification dispatch logic to dispatch messages to enabled channels based on recipient preferences and organization webhook configuration.
  - New route or action `POST /api/settings/test-webhook` to verify Slack and MS Teams connectivity.
  - Route to get and update current user's notification channel preferences.
-&ª*Frontend UI**:
  - Extend `src/pages/admin/SettingsPage.tsx` with Webhook Integrations tab / section.
  - Add user notification channel preference controls in `/notifications` or profile preferences.
-&ª*Localization**:
  - Add Indonesian & English i18n keys for multi-channel notification settings and user preferences.
