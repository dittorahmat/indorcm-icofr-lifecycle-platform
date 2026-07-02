## Why

Currently, notifications are only accessible within the application's internal UI (Notification Bell / Notification Center). There is no mechanism to send these notifications to users' email addresses. To improve user engagement and ensure critical compliance tasks (like CSA assignments or remediation actions) are addressed promptly, the system needs to send out email notifications. Furthermore, different client organizations will want to use their own email senders (e.g. `info@dsintegra.co.id`), which requires the sender profile and SMTP settings to be customizable on an organizational level.

## What Changes

- Add configurable email sender settings (SMTP details, Sender Name, Sender Email, and Provider selection) stored in the organization's metadata.
- Introduce a secure management form in the admin Settings page to save and test these SMTP configurations.
- Create an asynchronous backend email delivery service utilizing Cloudflare Workers.
- Update notification creation logic to automatically trigger an email to the assigned user when an in-app notification is created.
- Support fallback to system-wide default email credentials if no custom organization-level SMTP settings are configured.

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->
- `compliance-notification-system`: Add requirements for customizable SMTP configuration, user email retrieval, and automated asynchronous email dispatch triggered by notification generation.

## Impact

- **Database**: The `organization.metadata` column will store email provider settings (`emailProvider`, `smtpHost`, `smtpPort`, `smtpUser`, `smtpPass`, `senderEmail`, `senderName`).
- **Backend API**: 
  - `PUT /api/settings` in `worker/routes/users.ts` will be updated to accept and validate SMTP parameters.
  - An email delivery service will be integrated into the notification dispatch logic.
- **Frontend**: The `SettingsPage.tsx` will include a new section to configure, save, and test SMTP settings.
- **Environment Variables**: Add default system SMTP/API settings (`DEFAULT_SENDER_EMAIL`, etc.) in `.env` and `wrangler.jsonc` as fallbacks.
