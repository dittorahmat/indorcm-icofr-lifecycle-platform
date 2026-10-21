import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Locks the deployment contract for the second instance (`icofr-demo`).
 *
 * `wrangler.demo.jsonc` duplicates the primary config by necessity (the Vite
 * Cloudflare plugin reads one config per build). Without a test, those copies
 * drift silently — and a drift in `name`/`main` either breaks the demo or, worse,
 * makes the demo build overwrite the primary Worker. The artifact directory is
 * derived from `name` (`-` becomes `_`) by the plugin, so the deploy script path
 * is asserted instead of hand-maintained.
 */

const root = process.cwd();

function readJsonc(file: string): Record<string, unknown> {
  const raw = readFileSync(path.join(root, file), 'utf8');
  const withoutBlockComments = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutLineComments = withoutComments(withoutBlockComments);
  return JSON.parse(withoutLineComments);
}

/** Only strips full-line // comments so URLs inside strings stay intact. */
function withoutComments(source: string): string {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');
}

const primary = readJsonc('wrangler.jsonc');
const demo = readJsonc('wrangler.demo.jsonc');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

const SHARED_KEYS = [
  'main',
  'compatibility_date',
  'compatibility_flags',
  'assets',
  'observability',
  'durable_objects',
  'migrations',
] as const;

describe('wrangler.demo.jsonc', () => {
  it('keeps every shared key byte-identical to wrangler.jsonc', () => {
    for (const key of SHARED_KEYS) {
      expect(demo[key], `shared key "${key}" drifted from wrangler.jsonc`).toEqual(primary[key]);
    }
  });

  it('targets its own Worker and R2 bucket, never the primary ones', () => {
    expect(primary.name).toBe('icofr');
    expect(demo.name).toBe('icofr-demo');

    const primaryBucket = (primary.r2_buckets as { binding: string; bucket_name: string }[])[0];
    const demoBucket = (demo.r2_buckets as { binding: string; bucket_name: string }[])[0];
    expect(demoBucket.binding).toBe(primaryBucket.binding);
    expect(demoBucket.bucket_name).toBe('icofr-documents-demo');
    expect(demoBucket.bucket_name).not.toBe(primaryBucket.bucket_name);
  });

  it('runs with production guards and its own auth origin', () => {
    const vars = demo.vars as Record<string, string>;
    expect(vars.ENV).toBe('production');
    expect(vars.BETTER_AUTH_URL).toBe('https://icofr-demo.tech1solusi.workers.dev');
    expect(vars.SKIP_LICENSE).toBe(primary.SKIP_LICENSE ?? 'true');
  });

  it('keeps secrets out of the committed config', () => {
    const serialized = JSON.stringify(demo);
    for (const secret of ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'GEMINI_API_KEY', 'TARGET_DATABASE_URL']) {
      expect(serialized).not.toContain(secret);
    }
  });
});

describe('deployment scripts', () => {
  it('builds the demo bundle from the demo config and nothing else', () => {
    expect(pkg.scripts['build:demo']).toContain('WRANGLER_CONFIG=wrangler.demo.jsonc');
    expect(pkg.scripts.build).not.toContain('WRANGLER_CONFIG');
  });

  it('deploys the generated artifact derived from the demo Worker name', () => {
    const artifact = `dist/${String(demo.name).replace(/-/g, '_')}/wrangler.json`;
    const deploy = pkg.scripts['deploy:demo'];

    expect(deploy).toContain('build:demo');
    expect(deploy).toContain(artifact);
  });

  it('never deploys the primary config from the demo script', () => {
    const deploy = pkg.scripts['deploy:demo'];
    expect(deploy).not.toMatch(/-c\s+wrangler\.jsonc(\s|$)/);
    expect(deploy).not.toContain('dist/icofr/wrangler.json');
  });
});
