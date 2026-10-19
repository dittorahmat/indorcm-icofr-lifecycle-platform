import { describe, expect, it, vi } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';
import type { Control } from '@shared/types';
import type { ConfirmFunction } from '@/components/providers/ConfirmProvider';
import { createWorksheetColumns } from '../BPMWorksheetColumns';
import type { WorksheetRowCommit, WorksheetTextField } from '../worksheet-row';

/**
 * The desktop worksheet's column factory. Two contracts are locked here:
 *
 * 1. The identity column binds `Control.code`. It used to bind `bpmCode`, a
 *    column that belongs to `bpmProcesses` — so the cell rendered empty
 *    (`getValue()` returned undefined) and every blur sent `{ bpmCode }` to
 *    `PUT /controls/:id`, which has no such column.
 * 2. Every header is a `worksheet.*` key, so the table cannot regress to
 *    hardcoded Indonesian copy.
 */

const t = (key: string) => key;

const commit: WorksheetRowCommit = {
  saveField: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  openDiagramFor: vi.fn(),
};

const confirm: ConfirmFunction = vi.fn(async () => true);

const columns = createWorksheetColumns({
  t,
  confirm,
  elcControls: [],
  commit,
  setIsAddingApp: vi.fn(),
});

const accessorKeyOf = (column: ColumnDef<Control>) =>
  'accessorKey' in column && typeof column.accessorKey === 'string' ? column.accessorKey : undefined;

const stringHeaders = columns
  .map((column) => (typeof column.header === 'string' ? column.header : ''))
  .filter((header) => header !== '');

/**
 * The worksheet's whole text write surface. Declared as `WorksheetTextField[]`
 * so it doubles as a compile-time lock: that union is `keyof Pick<Control, …>`,
 * which means a name `Control` does not own — the original `bpmCode` — cannot
 * be added to either the union or this list without failing the type check.
 */
const WRITE_SURFACE: WorksheetTextField[] = [
  'code',
  'businessProcess',
  'subProcess',
  'name',
  'location',
  'description',
  'reference',
  'supportingDocs',
  'ipos',
  'assertions',
];

describe('createWorksheetColumns', () => {
  it('binds the identity column to Control.code, never the bpmProcesses bpmCode', () => {
    expect(columns.find((c) => accessorKeyOf(c) === 'code')).toBeDefined();
    expect(columns.filter((c) => accessorKeyOf(c) === 'bpmCode')).toHaveLength(0);
  });

  it('keeps the code column in the row commit write surface', () => {
    expect(WRITE_SURFACE).toContain('code');
    expect(new Set(WRITE_SURFACE).size).toBe(WRITE_SURFACE.length);
  });

  it('translates every header through the bpm worksheet bundle', () => {
    expect(stringHeaders.length).toBeGreaterThan(5);
    for (const header of stringHeaders) {
      expect(header).toMatch(/^worksheet\./);
    }
  });
});
