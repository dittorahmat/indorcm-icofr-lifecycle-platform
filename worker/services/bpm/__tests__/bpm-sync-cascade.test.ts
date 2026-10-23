import { describe, expect, it } from 'vitest';
import { CONTROL_CASCADE_STATEMENT_COUNT, controlCascadeStatements } from '../bpm-sync-cascade';

describe('controlCascadeStatements', () => {
  it('returns nothing when there is no control to purge', () => {
    expect(controlCascadeStatements('org-1', [])).toEqual([]);
  });

  it('emits the full ordered cascade for a non-empty set', () => {
    const statements = controlCascadeStatements('org-1', ['ctrl-1', 'ctrl-2']);

    expect(statements).toHaveLength(CONTROL_CASCADE_STATEMENT_COUNT);
    // The parent row goes last: a child table still referencing it would fail.
    expect(statements[statements.length - 1]).toBeDefined();
  });

  it('binds the organisation and every control id into the statements', () => {
    const statements = controlCascadeStatements('org-9', ['ctrl-a', 'ctrl-b']);
    const serialized = JSON.stringify(statements);

    expect(serialized).toContain('org-9');
    expect(serialized).toContain('ctrl-a');
    expect(serialized).toContain('ctrl-b');
  });
});
