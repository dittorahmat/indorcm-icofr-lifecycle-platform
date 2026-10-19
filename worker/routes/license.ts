import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad } from '../lib/utils';
import { rbac } from '../lib/guard';
import { getDb } from '../db';
import { systemLicenses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getMachineFingerprint, verifyLicense, checkLicenseStatus } from '../lib/license';

const licenseApp = new Hono<HonoEnv>();

licenseApp.get('/license/status', async (c) => {
  const skipLicense = c.env.SKIP_LICENSE || process.env.SKIP_LICENSE;
  if (skipLicense === 'true') {
      return ok(c, {
        status: 'active',
        daysRemaining: 999,
        clientName: 'Enterprise License'
      });
  }

  const db = getDb(c.env.DATABASE_URL);
  const activeLicense = await db.select().from(systemLicenses).limit(1);
  const fingerprint = getMachineFingerprint();

  if (activeLicense.length === 0) {
    return ok(c, {
      status: 'unactivated',
      machineId: fingerprint,
      daysRemaining: 0
    });
  }

  const license = activeLicense[0];
  const publicKey = c.env.LICENSE_PUBLIC_KEY || process.env.LICENSE_PUBLIC_KEY || '';
  const payload = await verifyLicense(license.licenseKey, publicKey);

  let daysRemaining = 0;
  if (payload) {
    const expiry = new Date(payload.expiryDate);
    daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  return ok(c, {
    status: license.status,
    machineId: fingerprint,
    daysRemaining,
    clientName: payload?.clientName,
    expiryDate: payload?.expiryDate,
    tier: payload?.tier
  });
});

licenseApp.post('/license/activate', rbac(['Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { licenseKey } = await c.req.json<{ licenseKey: string }>();

  if (!licenseKey) return bad(c, 'License key is required');

  const publicKey = c.env.LICENSE_PUBLIC_KEY || process.env.LICENSE_PUBLIC_KEY || '';
  const payload = await verifyLicense(licenseKey, publicKey);

  if (!payload) {
    return bad(c, 'Invalid license key signature');
  }

  const fingerprint = getMachineFingerprint();
  const status = checkLicenseStatus(payload, fingerprint);

  if (status) {
    return bad(c, `Activation failed: ${status}`);
  }

  const existing = await db.select().from(systemLicenses).limit(1);
  if (existing.length > 0) {
    await db.update(systemLicenses).set({
      licenseKey,
      status: 'active',
      machineCode: fingerprint,
      expiresAt: new Date(payload.expiryDate),
      activatedAt: new Date(),
      lastHeartbeat: new Date()
    }).where(eq(systemLicenses.id, existing[0].id));
  } else {
    await db.insert(systemLicenses).values({
      id: crypto.randomUUID(),
      licenseKey,
      status: 'active',
      machineCode: fingerprint,
      expiresAt: new Date(payload.expiryDate),
      activatedAt: new Date(),
      lastHeartbeat: new Date()
    });
  }

  return ok(c, { success: true });
});

export default licenseApp;
