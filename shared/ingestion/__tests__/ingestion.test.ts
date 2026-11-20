import { describe, it, expect } from 'vitest';
import {
  parseBalance,
  detectGLColumns,
  validateGLMapping,
  filterEmptyRows,
  calculateDataQualityScore,
} from '../index';

describe('shared/ingestion', () => {
  it('parses balances including currency strings and negative parentheses', () => {
    expect(parseBalance(1000).value).toBe(1000);
    expect(parseBalance('1.250,50').value).toBe(1250.5);
    expect(parseBalance('(500,00)').value).toBe(-500);
    expect(parseBalance('').value).toBe(0);
    expect(parseBalance(0).value).toBe(0);
  });

  it('filters completely empty rows while preserving valid entries', () => {
    const rows = [
      { a: '1', b: '2' },
      { a: '', b: null },
      { a: '   ', b: undefined },
      { a: 'hello', b: 'world' },
    ];
    const filtered = filterEmptyRows(rows);
    expect(filtered).toHaveLength(2);
    expect(filtered[0]).toEqual({ a: '1', b: '2' });
  });

  it('detects GL columns and validates mandatory fields', () => {
    const headers = ['No_GL', 'GL_Desc', 'GL_Balance', 'FSLI'];
    const detected = detectGLColumns(headers);
    expect(detected.accountCode).toBe('No_GL');
    expect(detected.accountName).toBe('GL_Desc');
    expect(detected.balance).toBe('GL_Balance');
    expect(detected.fsliName).toBe('FSLI');

    const validation = validateGLMapping(detected);
    expect(validation.valid).toBe(true);
    expect(validation.missing).toHaveLength(0);
  });

  it('computes data quality scores accurately', () => {
    const perfect = calculateDataQualityScore(100, 0, 0, 0);
    expect(perfect.score).toBe(100);
    expect(perfect.status).toBe('EXCELLENT');

    const flawed = calculateDataQualityScore(100, 10, 5, 5);
    expect(flawed.score).toBeLessThan(90);
    expect(flawed.status).toBe('NEEDS_REVIEW');
  });
});
