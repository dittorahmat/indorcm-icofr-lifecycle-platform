import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('deploy.sh sync and git safety invariants', () => {
  const deployScriptPath = path.resolve(process.cwd(), 'deploy.sh');
  const deployScript = readFileSync(deployScriptPath, 'utf8');

  it('preserves uncommitted user changes before line-ending renormalization', () => {
    // Stash check must precede git checkout/renormalize to avoid data loss
    const stashIndex = deployScript.indexOf('git stash push');
    const renormalizeIndex = deployScript.indexOf('git add --renormalize');
    const checkoutIndex = deployScript.indexOf('git checkout -- .');

    expect(stashIndex).toBeGreaterThan(-1);
    expect(renormalizeIndex).toBeGreaterThan(-1);
    expect(checkoutIndex).toBeGreaterThan(-1);

    // git stash push must be evaluated and performed before git checkout -- .
    expect(stashIndex).toBeLessThan(checkoutIndex);
  });

  it('runs git pull --ff-only after auto-renormalization', () => {
    const renormalizeIndex = deployScript.indexOf('git add --renormalize');
    const pullIndex = deployScript.indexOf('git pull --ff-only origin main');

    expect(renormalizeIndex).toBeGreaterThan(-1);
    expect(pullIndex).toBeGreaterThan(-1);
    expect(renormalizeIndex).toBeLessThan(pullIndex);
  });

  it('drops backup stash only if identical to new HEAD', () => {
    expect(deployScript).toContain('git diff --quiet "$STASH_REF" "$NEW_REV"');
    expect(deployScript).toContain('git stash drop');
    expect(deployScript).toContain('WARN: backup stash BERBEDA dari HEAD baru');
  });

  it('avoids futile nested retry loops on pull failure', () => {
    expect(deployScript).not.toContain('git pull --ff-only gagal pertama kali');
  });

  it('locks multi-endpoint health probe gate (DB settings + Better-Auth session)', () => {
    expect(deployScript).toContain('AUTH_HEALTH_URL="http://localhost:3001/api/auth/get-session"');
    expect(deployScript).toContain('BACKEND_URL="http://localhost:3001/api/settings"');
    expect(deployScript).toContain('curl -s -o /dev/null -w \'%{http_code}\' --max-time 15 "$AUTH_HEALTH_URL"');
    expect(deployScript).toContain('auth_http=$AUTH_HTTP_CODE');
  });
});
