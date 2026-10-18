/**
 * payloads — the ONE owner of the outbound webhook body for each provider.
 *
 * Before this module the same three shapes (Slack Block Kit, Teams MessageCard,
 * generic JSON) were built twice: once by the channel adapters and once inline in
 * `POST /settings/test-webhook`. The two copies had already drifted (the test
 * copy dropped the severity line and the action button), and only the adapters
 * were covered by a test. A call site now resolves `appUrl` and hands the fields
 * over; the body itself is never written at a call site.
 *
 * Pure: no fetch, no DB, no env access — `appUrl` and everything else arrive as
 * arguments, so both the adapters and the route can share it.
 */
export const WEBHOOK_PROVIDERS = ['slack', 'msTeams', 'generic'] as const;

export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[number];

/** Gate for route input: anything outside the union is rejected, never coerced. */
export function isWebhookProvider(value: unknown): value is WebhookProvider {
  return typeof value === 'string' && (WEBHOOK_PROVIDERS as readonly string[]).includes(value);
}

export interface WebhookPayloadInput {
  /** Absolute app origin; the caller resolves it from `BETTER_AUTH_URL`. */
  appUrl: string;
  message: string;
  title?: string;
  type?: string;
  link?: string;
  /** Generic shape only: the event name a receiver filters on. */
  event?: string;
  recipient?: { id: string; name?: string; email?: string } | null;
  metadata?: Record<string, unknown>;
}

const ACTION_LABEL = 'Buka di IndoGRC Pro';

export const GENERIC_WEBHOOK_EVENT = 'icofr.notification';

/** Teams paints severity; this map is its single owner. */
const TEAMS_THEME_COLOR: Record<string, string> = {
  error: 'E11D1',
  warning: 'FF8C00',
  success: '10B981',
  info: '0076D7',
};

function normalizedType(type?: string): string {
  return typeof type === 'string' && type ? type.toLowerCase() : 'info';
}

/**
 * Slack Block Kit. `text` keeps the RAW type (`[info] …`) because Slack renders it
 * as the notification fallback line, while the header uses the upper-cased type.
 */
export function buildSlackPayload(input: WebhookPayloadInput): Record<string, unknown> {
  const type = normalizedType(input.type);
  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: input.title || `IndoGRC Pro - ${type.toUpperCase()}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Severity:* ${type.toUpperCase()}\n${input.message}` },
    },
  ];

  if (input.link) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: ACTION_LABEL },
          url: `${input.appUrl}${input.link}`,
        },
      ],
    });
  }

  return { text: `[${input.type || 'info'}] ${input.message}`, blocks };
}

/** Teams legacy MessageCard. `potentialAction` stays present-but-undefined when there is no link. */
export function buildTeamsPayload(input: WebhookPayloadInput): Record<string, unknown> {
  const type = normalizedType(input.type);
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: input.title || 'IndoGRC Pro Alert',
    themeColor: TEAMS_THEME_COLOR[type] ?? TEAMS_THEME_COLOR.info,
    title: input.title || `IndoGRC Pro Notification [${type.toUpperCase()}]`,
    text: input.message,
    potentialAction: input.link
      ? [
          {
            '@type': 'OpenURI',
            name: ACTION_LABEL,
            targets: [{ os: 'default', uri: `${input.appUrl}${input.link}` }],
          },
        ]
      : undefined,
  };
}

/** Generic JSON webhook (Discord / n8n / Zapier / internal services). */
export function buildGenericPayload(input: WebhookPayloadInput): Record<string, unknown> {
  return {
    event: input.event ?? GENERIC_WEBHOOK_EVENT,
    timestamp: new Date().toISOString(),
    type: input.type || 'info',
    title: input.title || 'IndoGRC Pro Notification',
    message: input.message,
    link: input.link ? `${input.appUrl}${input.link}` : undefined,
    recipient: input.recipient ?? undefined,
    metadata: input.metadata,
  };
}

export function buildWebhookPayload(
  provider: WebhookProvider,
  input: WebhookPayloadInput,
): Record<string, unknown> {
  if (provider === 'slack') return buildSlackPayload(input);
  if (provider === 'msTeams') return buildTeamsPayload(input);
  return buildGenericPayload(input);
}

export interface SmtpTestEmailInput {
  senderEmail?: string;
  senderName?: string;
  smtpHost?: string;
}

/** The `POST /settings/test-email` body. Kept out of the handler so it is testable. */
export function buildSmtpTestEmailHtml(input: SmtpTestEmailInput): string {
  return `
        <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">SMTP Test Connection Successful</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.5;">Congratulations! Your custom email server configuration is working perfectly on IndoGRC Pro.</p>
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin: 16px 0; border: 1px solid #f1f5f9;">
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Sender Address:</strong> ${input.senderEmail || 'info@dsintegra.co.id'}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Sender Name:</strong> ${input.senderName || 'IndoGRC Pro'}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>SMTP Host:</strong> ${input.smtpHost || '-'}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">This is an automated test email. Please do not reply directly.</p>
        </div>
      `;
}
