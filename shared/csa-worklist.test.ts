import { describe, expect, it } from 'vitest';
import { unassessedControlsFrom } from './csa-worklist';

const SCOPE = { organizationId: 'org-bumn-default', year: 2027 };

describe('csa-worklist seam (derive belum-dinilai dari record)', () => {
  it('returns in-scope controls when no CSA records exist', () => {
    const controls = [
      { id: 'c1', organizationId: 'org-bumn-default', year: 2027, bpmProcessId: 'p1' },
      { id: 'c2', organizationId: 'org-bumn-default', year: 2027, bpmProcessId: 'p2' },
    ];
    expect(unassessedControlsFrom(controls, [], SCOPE)).toEqual(controls);
  });

  it('excludes controls outside the org/year scope', () => {
    const controls = [
      { id: 'c1', organizationId: 'org-bumn-default', year: 2027, bpmProcessId: 'p1' },
      { id: 'c-old', organizationId: 'org-bumn-default', year: 2026, bpmProcessId: 'p1' },
      { id: 'c-other', organizationId: 'org-lain', year: 2027, bpmProcessId: 'p1' },
    ];
    expect(unassessedControlsFrom(controls, [], SCOPE)).toEqual([controls[0]]);
  });

  it('excludes a control assessed by a non-draft record on the same BPM and year', () => {
    const controls = [
      { id: 'c1', organizationId: 'org-bumn-default', year: 2027, bpmProcessId: 'p1' },
      { id: 'c2', organizationId: 'org-bumn-default', year: 2027, bpmProcessId: 'p2' },
    ];
    const records = [
      { organizationId: 'org-bumn-default', controlId: null, bpmProcessId: 'p1', period: '2027-Q1', isDraft: false },
    ];
    expect(unassessedControlsFrom(controls, records, SCOPE)).toEqual([controls[1]]);
  });

  it('keeps a control whose only record is still a draft', () => {
    const controls = [
      { id: 'c1', organizationId: 'org-bumn-default', year: 2027, bpmProcessId: 'p1' },
    ];
    const records = [
      { organizationId: 'org-bumn-default', controlId: null, bpmProcessId: 'p1', period: '2027-Q1', isDraft: true },
    ];
    expect(unassessedControlsFrom(controls, records, SCOPE)).toEqual(controls);
  });

  it('ignores records from another year, org, or BPM', () => {
    const controls = [
      { id: 'c1', organizationId: 'org-bumn-default', year: 2027, bpmProcessId: 'p1' },
    ];
    const records = [
      { organizationId: 'org-bumn-default', controlId: null, bpmProcessId: 'p1', period: '2026-Q4', isDraft: false },
      { organizationId: 'org-lain', controlId: null, bpmProcessId: 'p1', period: '2027-Q1', isDraft: false },
      { organizationId: 'org-bumn-default', controlId: null, bpmProcessId: 'p9', period: '2027-Q1', isDraft: false },
    ];
    expect(unassessedControlsFrom(controls, records, SCOPE)).toEqual(controls);
  });

  it('excludes a control pointed at directly via controlId', () => {
    const controls = [
      { id: 'c1', organizationId: 'org-bumn-default', year: 2027, bpmProcessId: null },
    ];
    const records = [
      { organizationId: 'org-bumn-default', controlId: 'c1', bpmProcessId: null, period: '2027', isDraft: false },
    ];
    expect(unassessedControlsFrom(controls, records, SCOPE)).toEqual([]);
  });
});
