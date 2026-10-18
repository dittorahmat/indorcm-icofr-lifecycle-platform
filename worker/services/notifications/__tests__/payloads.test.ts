import { describe, expect, it } from 'vitest';
import {
  GENERIC_WEBHOOK_EVENT,
  buildGenericPayload,
  buildSlackPayload,
  buildSmtpTestEmailHtml,
  buildTeamsPayload,
  buildWebhookPayload,
  isWebhookProvider,
} from '../payloads';

const APP_URL = 'https://indogrc.example';

const baseInput = {
  appUrl: APP_URL,
  message: 'Harap verifikasi CSA R3',
  title: 'CSA Task Assigned',
  type: 'warning',
  link: '/csa',
};

describe('notification payload builders (one owner for the three shapes)', () => {
  describe('slack', () => {
    it('builds Block Kit with the upper-cased severity line and the raw type in the fallback text', () => {
      const payload = buildSlackPayload(baseInput) as {
        text: string;
        blocks: Array<Record<string, never>>;
      };

      // Slack renders `text` as the notification fallback line, so it keeps the type as sent.
      expect(payload.text).toBe('[warning] Harap verifikasi CSA R3');
      expect(payload.blocks[0]).toEqual({
        type: 'header',
        text: { type: 'plain_text', text: 'CSA Task Assigned' },
      });
      expect(payload.blocks[1]).toEqual({
        type: 'section',
        text: { type: 'mrkdwn', text: '*Severity:* WARNING\nHarap verifikasi CSA R3' },
      });
      expect(payload.blocks[2]).toEqual({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Buka di IndoGRC Pro' },
            url: 'https://indogrc.example/csa',
          },
        ],
      });
    });

    it('omits the action block without a link and falls back to a generated header', () => {
      const payload = buildSlackPayload({ ...baseInput, title: undefined, link: undefined });
      const blocks = (payload as { blocks: unknown[] }).blocks;
      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toEqual({
        type: 'header',
        text: { type: 'plain_text', text: 'IndoGRC Pro - WARNING' },
      });
    });

    it('normalises a missing type to info', () => {
      const payload = buildSlackPayload({ ...baseInput, type: undefined, title: undefined });
      expect((payload as { text: string }).text).toBe('[info] Harap verifikasi CSA R3');
    });
  });

  describe('msTeams', () => {
    it.each([
      ['error', 'E11D1'],
      ['warning', 'FF8C00'],
      ['success', '10B981'],
      ['info', '0076D7'],
      ['critical', '0076D7'],
    ])('paints %s with themeColor %s', (type, themeColor) => {
      const payload = buildTeamsPayload({ ...baseInput, type });
      expect(payload.themeColor).toBe(themeColor);
    });

    it('carries the OpenURI action when linked and undefined when not', () => {
      expect(buildTeamsPayload(baseInput).potentialAction).toEqual([
        { '@type': 'OpenURI', name: 'Buka di IndoGRC Pro', targets: [{ os: 'default', uri: `${APP_URL}/csa` }] },
      ]);
      expect(buildTeamsPayload({ ...baseInput, link: undefined }).potentialAction).toBeUndefined();
    });

    it('falls back to the platform titles', () => {
      const payload = buildTeamsPayload({ ...baseInput, title: undefined });
      expect(payload.summary).toBe('IndoGRC Pro Alert');
      expect(payload.title).toBe('IndoGRC Pro Notification [WARNING]');
    });
  });

  describe('generic', () => {
    it('absolutises the link and forwards the recipient and metadata', () => {
      const payload = buildGenericPayload({
        ...baseInput,
        recipient: { id: 'user-1', name: 'Ahmad', email: 'ahmad@company.com' },
        metadata: { source: 'csa' },
      });

      expect(payload.event).toBe(GENERIC_WEBHOOK_EVENT);
      expect(payload.type).toBe('warning');
      expect(payload.link).toBe(`${APP_URL}/csa`);
      expect(payload.recipient).toEqual({ id: 'user-1', name: 'Ahmad', email: 'ahmad@company.com' });
      expect(payload.metadata).toEqual({ source: 'csa' });
      expect(typeof payload.timestamp).toBe('string');
      expect(Number.isNaN(Date.parse(payload.timestamp as string))).toBe(false);
    });

    it('leaves link and recipient undefined when absent, and honours an explicit event', () => {
      const payload = buildGenericPayload({ appUrl: APP_URL, message: 'x', event: 'icorf.webhook.test' });
      expect(payload.event).toBe('icorf.webhook.test');
      expect(payload.link).toBeUndefined();
      expect(payload.recipient).toBeUndefined();
      expect(payload.title).toBe('IndoGRC Pro Notification');
    });
  });

  describe('buildWebhookPayload routing + provider guard', () => {
    it('routes each provider to its own shape', () => {
      expect(buildWebhookPayload('slack', baseInput)).toHaveProperty('blocks');
      expect(buildWebhookPayload('msTeams', baseInput)).toEqual(
        expect.objectContaining({ '@type': 'MessageCard' }),
      );
      expect(buildWebhookPayload('generic', baseInput)).toEqual(
        expect.objectContaining({ event: GENERIC_WEBHOOK_EVENT }),
      );
    });

    it('accepts only the three known providers', () => {
      for (const provider of ['slack', 'msTeams', 'generic']) {
        expect(isWebhookProvider(provider)).toBe(true);
      }
      for (const value of ['discord', '', null, undefined, 42, {}]) {
        expect(isWebhookProvider(value)).toBe(false);
      }
    });
  });

  describe('smtp test email', () => {
    it('renders the sender and host it was given', () => {
      const html = buildSmtpTestEmailHtml({
        senderEmail: 'noreply@bumn.go.id',
        senderName: 'ICOFR Bot',
        smtpHost: 'smtp.bumn.go.id',
      });
      expect(html).toContain('noreply@bumn.go.id');
      expect(html).toContain('ICOFR Bot');
      expect(html).toContain('smtp.bumn.go.id');
      expect(html).toContain('SMTP Test Connection Successful');
    });

    it('falls back instead of rendering undefined', () => {
      const html = buildSmtpTestEmailHtml({});
      expect(html).toContain('info@dsintegra.co.id');
      expect(html).toContain('IndoGRC Pro');
      expect(html).not.toContain('undefined');
    });
  });
});
