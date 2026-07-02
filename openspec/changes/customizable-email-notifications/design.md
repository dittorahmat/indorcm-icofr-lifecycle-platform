## Context

Currently, the IndoGRC Pro platform sends notification alerts only within the application UI (via `NotificationBell.tsx` and `NotificationCenter.tsx`). Users must be logged in to see assignments, deadlines, or change request statuses. 

We need to add email notification capabilities. Different BUMN organizations using the platform will require their own custom email sender addresses (e.g., `info@dsintegra.co.id`) to avoid being flagged as spam/phishing by their internal mail servers. The system must support both a default system-wide email fallback and organization-level customized SMTP/API settings.

## Goals / Non-Goals

**Goals:**
- Enable email dispatch for every in-app notification created.
- Allow organization-level configuration of custom SMTP host, port, username, password, sender email, and sender name.
- Fallback to system-wide default SMTP/API configuration if no custom configuration is set.
- Add an SMTP configuration form in the admin settings page.

**Non-Goals:**
- Real-time instant push notification delivery to mobile devices.
- Complex email templates/rich HTML layouts. Standard clean transactional HTML templates will be used.

## Decisions

### 1. Storage of SMTP Kredensial
- **Option A**: Create a new `email_settings` table.
- **Option B**: Store settings within the existing `metadata` column (JSONB) in the `organization` table.
- **Decision**: **Option B**. Since settings are managed per organization and the schema already includes a flexible `metadata` column on the `organization` table, we can store SMTP configurations there. This eliminates the need for database migrations and makes retrieval simple.

### 2. Email Sending Service in Workers
- **Option A**: Use a native TCP Socket SMTP library.
- **Option B**: Use HTTP REST API integrations (e.g., Resend, Mailgun, or SendGrid) for default system sending, and a worker-compatible SMTP helper for custom organization SMTP.
- **Decision**: **Option B**. Since Cloudflare Workers support outbound fetch, we can easily send emails via HTTP REST APIs. For custom SMTP servers configured by organizations, we will use a lightweight serverless-compatible SMTP sender or a standard SMTP fetch gateway.

### 3. Frontend Settings UI
- Add a new "Email Settings" section in the admin [SettingsPage.tsx](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/pages/admin/SettingsPage.tsx) page with fields:
  - Email Provider (System Default, Custom SMTP)
  - Sender Email
  - Sender Name
  - SMTP Host
  - SMTP Port
  - SMTP Username
  - SMTP Password

## Risks / Trade-offs

- **[Risk] SMTP Password Security**: Storing plain-text SMTP passwords in the database is a security risk.
  - *Mitigation*: Mask the password field in the UI after saving.
- **[Risk] Worker Execution Timeout**: Sending email synchronously during notification insert can block API responses or timeout.
  - *Mitigation*: Fire the email sending promise asynchronously (without awaiting it to block the response) or run it using Cloudflare Workers' `waitUntil` context so the API returns instantly.
