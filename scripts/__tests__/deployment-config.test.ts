import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Locks the deployment contract for every instance in the repository.
 *
 * Each non-primary instance duplicates the primary config by necessity (the Vite
 * Cloudflare plugin reads one config per build). Without this test those copies
 * drift silently — and a drift in `name`/`main` either breaks the instance or,
 * worse, makes its build overwrite another Worker. The artifact directory is
 * derived from `name` (`-` becomes `_`) by the plugin, so the deploy script path
 * is asserted instead of hand-maintained.
 *
 * The table is the contract: a `wrangler*.jsonc` that is not listed here fails
 * the coverage test, so adding a fourth instance cannot silently skip its
 * assertions.
 */

const root = process.cwd();

interface InstanceSpec {
  file: string;
  name: string;
  bucket: string;
  authUrl: string;
  buildScript: string;
  deployScript: string;
  primary?: boolean;
}

const INSTANCES: InstanceSpec[] = [
  {
    file: 'wrangler.jsonc',
    name: 'icofr',
    bucket: 'icofr-documents',
    authUrl: 'https://icofr.tech1solusi.workers.dev',
    buildScript: 'build',
    deployScript: 'deploy',
    primary: true,
  },
  {
    file: 'wrangler.demo.jsonc',
    name: 'icofr-demo',
    bucket: 'icofr-documents-demo',
    authUrl: 'https://icofr-demo.tech1solusi.workers.dev',
    buildScript: 'build:demo',
    deployScript: 'deploy:demo',
  },
  {
    file: 'wrangler.test.jsonc',
    name: 'icofr-test',
    bucket: 'icofr-documents-test',
    authUrl: 'https://icofr-test.tech1solusi.workers.dev',
    buildScript: 'build:test',
    deployScript: 'deploy:test',
  },
];

const SHARED_KEYS = [
  'main',
  'compatibility_date',
  'compatibility_flags',
  'assets',
  'observability',
  'durable_objects',
  'migrations',
] as const;

const SECRET_NAMES = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'GEMINI_API_KEY',
  'TARGET_DATABASE_URL',
  'DEMO_DATABASE_URL',
  'TEST_DATABASE_URL',
];

const ALLOWED_VAR_KEYS = ['BETTER_AUTH_URL', 'ENV', 'SKIP_LICENSE'];

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

function varsOf(config: Record<string, unknown>): Record<string, string> {
  const vars = config.vars;
  if (vars === undefined) return {};
  if (typeof vars !== 'object' || vars === null || Array.isArray(vars)) {
    throw new Error('vars must be an object');
  }
  return vars as Record<string, string>;
}

function firstBucketOf(config: Record<string, unknown>): { binding: string; bucket_name: string } {
  const buckets = config.r2_buckets;
  if (!Array.isArray(buckets) || buckets.length === 0) {
    throw new Error('r2_buckets must be a non-empty array');
  }
  const first = buckets[0];
  if (typeof first !== 'object' || first === null) {
    throw new Error('r2_buckets[0] must be an object');
  }
  return first as { binding: string; bucket_name: string };
}

function artifactPath(workerName: string): string {
  return `dist/${workerName.replace(/-/g, '_')}/wrangler.json`;
}

const primary = readJsonc('wrangler.jsonc');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const configFiles = readdirSync(root)
  .filter((file) => /^wrangler(\..+)?\.jsonc$/.test(file))
  .sort();
const configs = new Map(INSTANCES.map((spec) => [spec.file, readJsonc(spec.file)]));

describe('instance inventory', () => {
  it('covers every wrangler config in the repository', () => {
    expect(configFiles).toEqual(INSTANCES.map((spec) => spec.file).sort());
  });

  it('keeps Worker names, buckets, and auth origins unique', () => {
    expect(new Set(INSTANCES.map((spec) => spec.name)).size).toBe(INSTANCES.length);
    expect(new Set(INSTANCES.map((spec) => spec.bucket)).size).toBe(INSTANCES.length);
    expect(new Set(INSTANCES.map((spec) => spec.authUrl)).size).toBe(INSTANCES.length);
  });
});

for (const spec of INSTANCES) {
  describe(spec.file, () => {
    const config = configs.get(spec.file);
    if (!config) throw new Error(`missing config for ${spec.file}`);

    it('keeps every shared key identical to wrangler.jsonc', () => {
      for (const key of SHARED_KEYS) {
        expect(config[key], `shared key "${key}" drifted from wrangler.jsonc`).toEqual(primary[key]);
      }
    });

    it('targets its own Worker and R2 bucket', () => {
      expect(config.name).toBe(spec.name);
      const bucket = firstBucketOf(config);
      expect(bucket.binding).toBe(firstBucketOf(primary).binding);
      expect(bucket.bucket_name).toBe(spec.bucket);
    });

    if (spec.primary) {
      it('keeps the primary auth origin out of vars and uses the default build', () => {
        expect(varsOf(config).BETTER_AUTH_URL).toBeUndefined();
        expect(pkg.scripts.build).not.toContain('WRANGLER_CONFIG');
      });
    } else {
      it('runs with production guards and its own auth origin', () => {
        const vars = varsOf(config);
        expect(vars.ENV).toBe('production');
        expect(vars.SKIP_LICENSE).toBe('true');
        expect(vars.BETTER_AUTH_URL).toBe(spec.authUrl);
      });

      it('builds from its own config and deploys its own artifact', () => {
        const build = pkg.scripts[spec.buildScript];
        const deploy = pkg.scripts[spec.deployScript];

        expect(build, `missing ${spec.buildScript}`).toBeDefined();
        expect(deploy, `missing ${spec.deployScript}`).toBeDefined();
        expect(build).toContain(`WRANGLER_CONFIG=${spec.file}`);
        expect(deploy).toContain(spec.buildScript);
        expect(deploy).toContain(artifactPath(spec.name));
      });

      it('never deploys another instance artifact', () => {
        const deploy = pkg.scripts[spec.deployScript] ?? '';
        for (const other of INSTANCES.filter((instance) => instance.file !== spec.file)) {
          expect(deploy, `${spec.deployScript} mentions ${other.name}`).not.toContain(
            artifactPath(other.name),
          );
        }
        expect(deploy).not.toMatch(/-c\s+wrangler\.jsonc(\s|$)/);
      });
    }

    it('keeps secrets and unexpected vars out of the committed config', () => {
      const serialized = JSON.stringify(config);
      for (const secret of SECRET_NAMES) {
        expect(serialized).not.toContain(secret);
      }
      for (const key of Object.keys(varsOf(config))) {
        expect(ALLOWED_VAR_KEYS, `unexpected var "${key}" in ${spec.file}`).toContain(key);
      }
    });
  });
}
