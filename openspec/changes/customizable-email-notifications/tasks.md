## 1. Schema & Type Extensions

- [x] 1.1 Add email configuration fields to `Settings` interface in `shared/types.ts`
- [x] 1.2 Update API settings mapper in `worker/routes/users.ts` (GET and PUT endpoints) to serialize/deserialize SMTP configurations in `organization.metadata`

## 2. Backend Email Dispatch Service

- [x] 2.1 Create `worker/services/email.ts` with helper to dispatch emails using custom SMTP settings or system default API fallback
- [x] 2.2 Add an API route `POST /api/settings/test-email` to verify SMTP settings by sending a test email to the current logged-in user

## 3. Notification Logic Integration

- [x] 3.1 Refactor notification insertion logic to query the user's email address and automatically invoke the email sending service asynchronously
- [x] 3.2 Update `POST /api/notifications` in `worker/routes/notifications.ts` to dispatch an email alongside the database insertion

## 4. Frontend Settings Form & Validation

- [x] 4.1 Create an "Email Settings" section in `src/pages/admin/SettingsPage.tsx` with inputs for provider, SMTP details, sender email, and password (password must be masked)
- [x] 4.2 Add validation and dynamic visibility logic for SMTP credentials fields based on the selected email provider
- [x] 4.3 Add a "Test Connection" button in the Settings UI that triggers `POST /api/settings/test-email` and shows a status toast

## 5. i18n and Validation Checks

- [x] 5.1 Add English and Indonesian translation strings for all newly added UI elements in `src/i18n/locales/`
- [x] 5.2 Verify integrity by executing validation scripts: `npm run type-check`, `npm run lint`, and `npm run build`
