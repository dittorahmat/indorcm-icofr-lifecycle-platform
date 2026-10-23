import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * The three whole-tree invariants (pre-commit + CI) are gates, so they get a
 * locking test of their own: a checker that silently stops detecting the thing
 * it was written for is worse than no checker, because the gate stays green
 * while the class of defect it names returns.
 *
 * Each case builds a throwaway tree and runs the real CLI against it via
 * `--root`, so the test exercises the same entry point the hook runs.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const tempRoots: string[] = [];

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'repo-invariants-'));
  tempRoots.push(root);
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}

function run(script: string, root: string): { status: number; output: string } {
  const result = spawnSync(process.execPath, [join(REPO_ROOT, 'scripts', script), '--root', root], {
    encoding: 'utf8',
  });
  return { status: result.status ?? -1, output: `${result.stdout}${result.stderr}` };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('check-test-i18n', () => {
  it('fails an identity mock', () => {
    const root = tree({
      'src/a.test.ts': "import { vi } from 'vitest';\nvi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));\n",
    });
    const { status, output } = run('check-test-i18n.mjs', root);
    expect(status).toBe(1);
    expect(output).toContain('identity i18n mock');
  });

  it('fails a defaultValue fallback and a hardcoded table', () => {
    const fallback = tree({
      'src/b.test.ts': "vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue || key }) }));\n",
    });
    expect(run('check-test-i18n.mjs', fallback).status).toBe(1);

    const table = tree({
      'src/c.test.ts': "vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => { if (key === 'a.b') return 'English'; return key; } }) }));\n",
    });
    const { status, output } = run('check-test-i18n.mjs', table);
    expect(status).toBe(1);
    expect(output).toContain('hardcoded i18n table');
  });

  it('passes the strict helper and a mock that reads the real bundle', () => {
    const strict = tree({
      'src/d.test.ts': "import { strictT } from '../../test/mock-i18n';\nvi.mock('react-i18next', () => ({ useTranslation: () => ({ t: strictT }) }));\n",
    });
    expect(run('check-test-i18n.mjs', strict).status).toBe(0);
  });
});

describe('check-doc-refs', () => {
  it('fails a comment citing a missing file', () => {
    const root = tree({ 'src/a.ts': '// see scripts/missing.ts for details\nexport {};\n' });
    const { status, output } = run('check-doc-refs.mjs', root);
    expect(status).toBe(1);
    expect(output).toContain('scripts/missing.ts');
  });

  it('passes an existing path and ignores extensionless module citations', () => {
    const root = tree({
      'src/a.ts': '// feeds scripts/present.mjs and worker/app\n// see docs/gone.ts\nexport {};\n',
      'scripts/present.mjs': 'export {};\n',
    });
    // `docs/gone.ts` has an extension and does not exist - it must fail, which
    // also proves the extensionless `worker/app` is what is being ignored.
    const { status, output } = run('check-doc-refs.mjs', root);
    expect(status).toBe(1);
    expect(output).toContain('docs/gone.ts');
    expect(output).not.toContain('worker/app');

    const clean = tree({
      'src/a.ts': '// see scripts/present.mjs\nexport {};\n',
      'scripts/present.mjs': 'export {};\n',
    });
    expect(run('check-doc-refs.mjs', clean).status).toBe(0);
  });
});

describe('check-ocr-constants', () => {
  it('fails a re-declaration outside the owner files', () => {
    const root = tree({ 'src/lib/layout.ts': 'export const LANE_FOOTER = 80;\n' });
    const { status, output } = run('check-ocr-constants.mjs', root);
    expect(status).toBe(1);
    expect(output).toContain('re-declares LANE_FOOTER');
  });

  it('passes the owner declaration and a consumer import', () => {
    const root = tree({
      'src/utils/ocr-layout-rows.ts': 'export const LANE_FOOTER = 80;\nexport function contentLaneHeight(): number { return 1; }\n',
      'src/utils/ocr-layout.ts': "import { LANE_FOOTER } from './ocr-layout-rows';\nexport const laneFooter = LANE_FOOTER;\n",
    });
    expect(run('check-ocr-constants.mjs', root).status).toBe(0);
  });
});
