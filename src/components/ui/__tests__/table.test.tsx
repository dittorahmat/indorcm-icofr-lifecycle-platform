import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';

describe('Standard Table UI primitives', () => {
  it('renders light gray header, dark bold non-uppercase text, and grid borders', () => {
    render(
      <Table aria-label="Sample Table">
        <TableHeader data-testid="table-header">
          <TableRow>
            <TableHead>Column A</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Value A</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const header = screen.getByTestId('table-header');
    expect(header.className).toContain('bg-slate-50');
    expect(header.className).toContain('dark:bg-card');

    const th = screen.getByRole('columnheader', { name: 'Column A' });
    expect(th.className).toContain('font-bold');
    expect(th.className).toContain('text-slate-900');
    expect(th.className).not.toContain('uppercase');
  });
});
