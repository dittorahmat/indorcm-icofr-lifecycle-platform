import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageHeader } from '../PageHeader';

vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: ({ className }: { className?: string }) => (
    <button type="button" aria-label="Toggle sidebar" className={className} />
  ),
}));

function renderHeader() {
  return render(
    <PageHeader title="Deficiency Board" description="Track remediation">
      <div data-testid="wide-actions">actions</div>
    </PageHeader>,
  );
}

describe('PageHeader desktop squeeze guard', () => {
  it('gives the title block flex share with a readable minimum width', () => {
    const { container } = renderHeader();
    const titleBlock = screen.getByText('Deficiency Board').closest('div')?.parentElement;
    expect(titleBlock?.className).toMatch(/flex-1/);
    expect(titleBlock?.className).toMatch(/min-w-\[200px\]/);
  });

  it('caps the actions block and lets it wrap instead of squeezing the title', () => {
    const { container } = renderHeader();
    const actions = screen.getByTestId('wide-actions').parentElement;
    expect(actions?.className).toMatch(/sm:max-w-\[58%\]/);
    expect(actions?.className).toMatch(/sm:flex-wrap/);
    expect(actions?.className).not.toMatch(/shrink-0/);
    expect(actions?.className).not.toMatch(/\[&>*\]:shrink-0/);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('hides SidebarTrigger on mobile to prevent duplicate trigger alongside MainHeader', () => {
    renderHeader();
    const sidebarTrigger = screen.getByRole('button', { name: /toggle sidebar/i });
    expect(sidebarTrigger).toHaveClass('hidden');
    expect(sidebarTrigger).toHaveClass('md:flex');
  });
});
