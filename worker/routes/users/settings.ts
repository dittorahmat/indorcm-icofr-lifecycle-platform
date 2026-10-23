import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import { organization, user } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { Settings } from '@shared/types';
import { sendEmail } from '../../services/email';
import { rbac } from '../../lib/guard';
import { buildWebhookPayload, buildSmtpTestEmailHtml, isWebhookProvider } from '../../services/notifications/payloads';

/** The `organization.metadata` blob this route owns, spelled out once. */
interface OrganizationMetadata {
  ceoName?: string;
  cfoName?: string;
  fiscalYear?: number;
  periodYear?: number;
  isPeriodLocked?: boolean;
  verificationHash?: string;
  signedOffDate?: string | number;
  emailProvider?: Settings['emailProvider'];
  senderEmail?: string;
  senderName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  customYears?: Settings['customYears'];
  slackWebhookUrl?: string;
  slackEnabled?: boolean;
  msTeamsWebhookUrl?: string;
  msTeamsEnabled?: boolean;
  genericWebhookUrl?: string;
  genericWebhookEnabled?: boolean;
}

const settings = new Hono<HonoEnv>();

settings.get('/settings', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');

  const orgs = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
  if (orgs.length === 0) return notFound(c, 'ORGANIZATION_NOT_FOUND', 'Organization not found');

  const org = orgs[0];
  const meta = (org.metadata ?? {}) as OrganizationMetadata;

  const response: Settings = {
    id: org.id,
    companyName: org.name,
    logoUrl: org.logo || undefined,
    ceoName: meta.ceoName || "Direktur Utama",
    cfoName: meta.cfoName || "Direktur Keuangan",
    fiscalYear: meta.fiscalYear || meta.periodYear || new Date().getFullYear(),
    isPeriodLocked: meta.isPeriodLocked || false,
    verificationHash: meta.verificationHash,
    signedOffDate: meta.signedOffDate ? (typeof meta.signedOffDate === 'string' ? new Date(meta.signedOffDate).getTime() : meta.signedOffDate) : undefined,
    emailProvider: meta.emailProvider || 'system',
    senderEmail: meta.senderEmail || '',
    senderName: meta.senderName || '',
    smtpHost: meta.smtpHost || '',
    smtpPort: meta.smtpPort || 587,
    smtpUser: meta.smtpUser || '',
    smtpPass: meta.smtpPass || '',
    customYears: meta.customYears || [],
    slackWebhookUrl: meta.slackWebhookUrl || '',
    slackEnabled: meta.slackEnabled ?? false,
    msTeamsWebhookUrl: meta.msTeamsWebhookUrl || '',
    msTeamsEnabled: meta.msTeamsEnabled ?? false,
    genericWebhookUrl: meta.genericWebhookUrl || '',
    genericWebhookEnabled: meta.genericWebhookEnabled ?? false,
  };

  return ok(c, response);
});

settings.put('/settings', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<Partial<Settings>>();

  const orgs = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
  if (orgs.length === 0) return notFound(c, 'ORGANIZATION_NOT_FOUND', 'Organization not found');

  const org = orgs[0];
  const meta = (org.metadata ?? {}) as OrganizationMetadata;

  const updatedMeta: OrganizationMetadata = {
    ...meta,
    ceoName: body.ceoName,
    cfoName: body.cfoName,
    fiscalYear: body.fiscalYear,
    isPeriodLocked: body.isPeriodLocked,
    emailProvider: body.emailProvider,
    senderEmail: body.senderEmail,
    senderName: body.senderName,
    smtpHost: body.smtpHost,
    smtpPort: body.smtpPort,
    smtpUser: body.smtpUser,
    smtpPass: body.smtpPass,
    customYears: body.customYears,
    slackWebhookUrl: body.slackWebhookUrl,
    slackEnabled: body.slackEnabled,
    msTeamsWebhookUrl: body.msTeamsWebhookUrl,
    msTeamsEnabled: body.msTeamsEnabled,
    genericWebhookUrl: body.genericWebhookUrl,
    genericWebhookEnabled: body.genericWebhookEnabled,
  };

  await db.update(organization)
    .set({
      name: body.companyName,
      logo: body.logoUrl,
      metadata: updatedMeta
    })
    .where(eq(organization.id, orgId));

  return ok(c, { success: true });
});

settings.post('/settings/test-email', rbac(['Admin', 'Line 2']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const userId = c.get('userId');
  const body = await c.req.json<Partial<Settings>>();

  const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (currentUser.length === 0) return notFound(c, 'USER_NOT_FOUND', 'User not found');

  try {
    await sendEmail({
      to: currentUser[0].email,
      subject: 'IndoGRC Pro - Test SMTP Connection',
      html: buildSmtpTestEmailHtml(body),
      settings: body,
      env: c.env,
    });
    return ok(c, { success: true });
  } catch (error: unknown) {
    console.error('SMTP Test Error:', error);
    return bad(c, 'SMTP_TEST_FAILED', 502, error instanceof Error ? error.message : 'Failed to send test email');
  }
});

settings.post('/settings/test-webhook', rbac(['Admin', 'Line 2']), async (c) => {
  const body = await c.req.json<{ provider: unknown; webhookUrl: string }>();
  if (!body.webhookUrl) return bad(c, 'WEBHOOK_URL_REQUIRED', 400, 'Webhook URL is required');
  if (!isWebhookProvider(body.provider)) {
    return bad(c, 'WEBHOOK_PROVIDER_UNKNOWN', 400, 'Unknown webhook provider');
  }

  // The test endpoint sends the SAME body a real notification sends: that is the
  // point of the button, and the body shape has one owner
  // (`worker/services/notifications/payloads.ts`).
  const payload = buildWebhookPayload(body.provider, {
    appUrl: c.env.BETTER_AUTH_URL || 'http://localhost:3000',
    title: 'IndoGRC Pro - Webhook Test Connection',
    message: 'Selamat! Koneksi webhook notifikasi IndoGRC Pro berhasil terhubung dengan sukses.',
    type: 'success',
    link: '/notifications',
  });

  try {
    const response = await fetch(body.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return bad(c, 'WEBHOOK_TEST_FAILED', 502, `Webhook provider returned HTTP ${response.status}`);
    }

    return ok(c, { success: true });
  } catch (err: unknown) {
    console.error('Webhook Test Error:', err);
    return bad(c, 'WEBHOOK_TEST_FAILED', 502, err instanceof Error ? err.message : 'Failed to send test webhook');
  }
});

export default settings;
