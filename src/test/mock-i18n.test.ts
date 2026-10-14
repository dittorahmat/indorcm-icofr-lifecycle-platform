import { describe, expect, it } from 'vitest';
import {
  BUNDLES,
  lookupEnKey,
  strictT,
  validateI18nKey,
} from './mock-i18n';

describe('mock-i18n strict test helper', () => {
  it('resolves keys that exist in the en bundle', () => {
    expect(lookupEnKey('csa_hub', 'page.worklist.cta')).toBe('Start CSA');
    expect(lookupEnKey('common', 'actions.cancel')).toBe('Cancel');
  });

  it('returns undefined for missing keys without throwing', () => {
    expect(lookupEnKey('csa_hub', 'worklist.cta')).toBeUndefined();
    expect(lookupEnKey('nope', 'x')).toBeUndefined();
  });

  it('accepts the 15 configured namespaces', () => {
    expect(Object.keys(BUNDLES)).toHaveLength(15);
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
