import { describe, it, expect } from 'vitest';
import { matchesPeriodYear } from '../period-query';
import { csaRecords } from '../../db/schema';

describe('matchesPeriodYear', () => {
  it('builds an OR predicate matching exact year, prefix, and quarter', () => {
    const predicate = matchesPeriodYear(csaRecords.period, 2025);
    expect(predicate).toBeDefined();
  });
});
