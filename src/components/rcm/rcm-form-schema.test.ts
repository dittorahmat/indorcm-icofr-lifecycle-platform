import { describe, expect, it } from 'vitest';
import { createRcmFormSchema, defaultRcmValues, parseRcmBool, resolveRcmWorkflowStatus, valuesFromData } from './rcm-form-schema';

const t = (key: string) => key;
const schema = createRcmFormSchema(t);

describe('rcm-form-schema seam (RCM TLC/ELC/ITGC form values)', () => {
  it.each([
    ['Y', true],
    [true, true],
    ['true', true],
    ['N', false],
    [false, false],
    ['false', false],
    [null, false],
    [undefined, false],
    ['', false],
  ])('parseRcmBool(%j) is %j', (input, expected) => {
    expect(parseRcmBool(input)).toBe(expected);
  });

  it('ships falsy boolean defaults with empty identity', () => {
    expect(defaultRcmValues).toMatchObject({ id: '', mappingId: '', isFraudRelated: false, ipoC: false, assertionPd: false });
  });

  it('coerces Y/N rows into strict booleans while keeping text fields', () => {
    const values = valuesFromData({ mappingId: 'm1', isKeyControl: 'Y', ipoC: 'N', assertionE: true, mappedControlName: 'Rekonsiliasi bank' });
    expect(values.isKeyControl).toBe(true);
    expect(values.ipoC).toBe(false);
    expect(values.assertionE).toBe(true);
    expect(values.mappedControlName).toBe('Rekonsiliasi bank');
    expect(schema.safeParse({ ...defaultRcmValues, ...values }).success).toBe(true);
  });

  it('rejects an empty control name with the localized message', () => {
    const parsed = schema.safeParse({ ...defaultRcmValues, mappingId: 'm1', mappedControlName: '' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0]?.message).toBe('matrix.validation.control_name_required');
  });

  it.each([
    [{ workflowStatus: 'In Review' }, 'In Review'],
    [{ status: 'Pending Change Approval' }, 'In Review'],
    [{ status: 'Active' }, 'Approved'],
    [{}, 'Draft'],
    [{ status: 'Rejected' }, 'Draft'],
  ])('resolveRcmWorkflowStatus(%j) is %j', (input, expected) => {
    expect(resolveRcmWorkflowStatus(input)).toBe(expected);
  });
});
