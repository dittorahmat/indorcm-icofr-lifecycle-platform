import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BUNDLES,
  lookupEnKey,
  strictT,
  validateI18nKey,
} from './mock-i18n';

/**
 * Vetted literal (never derived from the fixture under test). `config.ts` holds
 * the real namespace set; this list pins the helper to it, so a namespace added
 * to the app cannot stay invisible to the strict `t()` mock.
 */
const CONFIGURED_NAMESPACES = [
  'common', 'sidebar', 'scoping', 'dashboard', 'reports', 'knowledge', 'bpm',
  'deficiency', 'testing', 'risklibrary', 'rcm', 'csa_hub', 'ai', 'workflow',
  'auth', 'admin',
] as const;

const CONFIG_SOURCE = readFileSync(resolve(process.cwd(), 'src/i18n/config.ts'), 'utf-8');

describe('mock-i18n strict test helper', () => {
  it('resolves keys that exist in the en bundle', () => {
    expect(lookupEnKey('csa_hub', 'page.worklist.cta')).toBe('Start CSA');
    expect(lookupEnKey('common', 'actions.cancel')).toBe('Cancel');
  });

  it('returns undefined for missing keys without throwing', () => {
    expect(lookupEnKey('csa_hub', 'worklist.cta')).toBeUndefined();
    expect(lookupEnKey('nope', 'x')).toBeUndefined();
  });

  it('mirrors exactly the namespaces configured in src/i18n/config.ts', () => {
    expect(Object.keys(BUNDLES).sort()).toEqual([...CONFIGURED_NAMESPACES].sort());

    const nsList = CONFIG_SOURCE.match(/ns:\s*\[([^\]]+)\]/)?.[1];
    expect(nsList, 'config.ts must declare an `ns: [...]` list').toBeTruthy();
    const configured = new Set(
      (nsList as string).split(',').map((entry) => entry.trim().replace(/['"]/g, '')).filter(Boolean),
    );
    expect([...configured].sort()).toEqual([...CONFIGURED_NAMESPACES].sort());
  });

  it('validateI18nKey passes on existing keys in any namespace', () => {
    expect(() => validateI18nKey('page.worklist.cta')).not.toThrow();
    expect(() => validateI18nKey('csa_hub:page.worklist.cta')).not.toThrow();
  });

  it('validateI18nKey throws on keys missing everywhere', () => {
    expect(() => validateI18nKey('worklist.cta')).toThrow(/missing en locale key/);
  });

  it('validateI18nKey skips dynamic keys by design', () => {
    expect(() => validateI18nKey('a ${b}')).not.toThrow();
    expect(() => validateI18nKey('')).not.toThrow();
  });

  it('strictT returns a string fallback verbatim (prod parity)', () => {
    expect(strictT('common:actions.title', 'Aksi')).toBe('Aksi');
  });

  it('strictT returns an object defaultValue verbatim (prod parity)', () => {
    expect(strictT('realizationTable.frequencies.Annual', { defaultValue: 'Annual' })).toBe('Annual');
  });
});
