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
import { validateSafeWebhookUrl } from '../../lib/ssrf';

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
  const userRole = c.get('userRole');
  const isPrivileged = userRole === 'Admin' || userRole === 'Line 2';

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
    senderEmail: isPrivileged ? (meta.senderEmail || '') : '',
    senderName: meta.senderName || '',
    smtpHost: isPrivileged ? (meta.smtpHost || '') : '',
    smtpPort: isPrivileged ? (meta.smtpPort || 587) : 587,
    smtpUser: isPrivileged ? (meta.smtpUser || '') : '',
    smtpPass: (isPrivileged && meta.smtpPass) ? '********' : '',
    customYears: meta.customYears || [],
    slackWebhookUrl: isPrivileged ? (meta.slackWebhookUrl || '') : '',
    slackEnabled: isPrivileged ? (meta.slackEnabled ?? false) : false,
    msTeamsWebhookUrl: isPrivileged ? (meta.msTeamsWebhookUrl || '') : '',
    msTeamsEnabled: isPrivileged ? (meta.msTeamsEnabled ?? false) : false,
    genericWebhookUrl: isPrivileged ? (meta.genericWebhookUrl || '') : '',
    genericWebhookEnabled: isPrivileged ? (meta.genericWebhookEnabled ?? false) : false,
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

  // Regulatory protection: if period is signed off (has verificationHash), lock cannot be undone
  if (meta.verificationHash) {
    if (body.isPeriodLocked === false) {
      return bad(c, 'CANNOT_UNLOCK_SIGNED_PERIOD', 403, 'Cannot unlock period after official sign-off');
    }
    if (body.fiscalYear !== undefined && body.fiscalYear !== (meta.fiscalYear || meta.periodYear)) {
      return bad(c, 'CANNOT_MODIFY_SIGNED_PERIOD_YEAR', 403, 'Cannot change fiscal year of signed-off period');
    }
  }

  // If smtpPass is unchanged placeholder '********' or undefined, keep existing password
  const finalSmtpPass = (body.smtpPass && body.smtpPass !== '********')
    ? body.smtpPass
    : meta.smtpPass;

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
    smtpPass: finalSmtpPass,
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
  const orgId = c.get('organizationId');
  const body = await c.req.json<Partial<Settings>>();

  const currentUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (currentUser.length === 0) return notFound(c, 'USER_NOT_FOUND', 'User not found');

  // If smtpPass was redacted ('********'), pull existing password from DB
  let effectiveSettings = body;
  if (body.smtpPass === '********' || !body.smtpPass) {
    const orgs = await db.select().from(organization).where(eq(organization.id, orgId)).limit(1);
    const existingMeta = (orgs[0]?.metadata ?? {}) as OrganizationMetadata;
    effectiveSettings = { ...body, smtpPass: existingMeta.smtpPass };
  }

  try {
    await sendEmail({
      to: currentUser[0].email,
      subject: 'IndoGRC Pro - Test SMTP Connection',
      html: buildSmtpTestEmailHtml(effectiveSettings),
      settings: effectiveSettings,
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

  // SSRF Protection
  const validation = validateSafeWebhookUrl(body.webhookUrl);
  if (!validation.valid) {
    return bad(c, 'SSRF_TARGET_BLOCKED', 400, validation.reason ?? 'Webhook URL is not permitted');
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
