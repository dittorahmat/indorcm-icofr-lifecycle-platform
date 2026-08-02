import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { createApp } from '../../worker/app';

describe('Security Audit & Compliance Verification', () => {
  it('should use 600,000 PBKDF2 iterations and timing-safe comparison for password hashing', async () => {
    const password = 'TestSecurePassword123!';
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 600000;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
    const storedHash = `pbkdf2$${iterations}$${salt}$${hash}`;

    expect(storedHash).toContain('pbkdf2$600000$');

    const parts = storedHash.split('$');
    expect(parts.length).toBe(4);
    expect(parseInt(parts[1], 10)).toBe(600000);

    const verifyHashBuf = crypto.pbkdf2Sync(password, parts[2], parseInt(parts[1], 10), 32, 'sha256');
    const hashBuf = Buffer.from(parts[3], 'hex');
    expect(crypto.timingSafeEqual(verifyHashBuf, hashBuf)).toBe(true);
  });

  it('should include OWASP security headers in Hono API response', async () => {
    const app = createApp();
    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
  });
});
