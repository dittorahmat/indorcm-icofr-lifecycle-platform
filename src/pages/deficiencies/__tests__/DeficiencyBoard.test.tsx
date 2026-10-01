import React from 'react';
import { render, fireEvent, within, type RenderResult } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeficiencyBoard } from '../DeficiencyBoard';
import { resolveWorkflowAction } from '@/lib/deficiency-workflow';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
}

beforeEach(() => {
  setViewportWidth(1024);
});

function renderBoard(): RenderResult {
  return render(
    <SidebarProvider>
      <UnsavedChangesProvider>
        <DeficiencyBoard />
      </UnsavedChangesProvider>
    </SidebarProvider>
  );
}

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

/**
 * One fixture per evaluation origin across the Three Lines Model, plus a
 * legacy `Lini 2 - CSA Validation` record that must keep grouping under TOE.
 */
const deficiencies = [
  { id: 'd1', code: 'DEF-001', controlName: 'Kontrol Kas Kecil', severity: 'Significant Deficiency', processName: 'Kas & Bank', source: 'Lini 1 - CSA' },
  { id: 'd2', code: 'DEF-002', controlName: 'Kontrol Rekonsiliasi', severity: 'Control Deficiency', processName: 'Rekonsiliasi', source: 'Lini 2 - TOD Review' },
  { id: 'd3', code: 'DEF-003', controlName: 'Kontrol Persediaan', severity: 'Material Weakness', processName: 'Persediaan', source: 'Lini 2 - TOE Review' },
  { id: 'd4', code: 'DEF-004', controlName: 'Kontrol Piutang', severity: 'Control Deficiency', processName: 'Piutang', source: 'Lini 2 - CSA Validation' },
  { id: 'd5', code: 'DEF-005', controlName: 'Kontrol Pendapatan', severity: 'Significant Deficiency', processName: 'Pendapatan', source: 'Lini 3 - Audit' },
];

const actionPlans = [
  { id: 'ap1', deficiencyId: 'd1', workflowStatus: 'Ineffective', status: 'Open', dueDate: Date.now() + 86400000 * 30 },
  { id: 'ap2', deficiencyId: 'd2', workflowStatus: 'In Review', status: 'Submitted', dueDate: Date.now() + 86400000 * 30 },
  { id: 'ap3', deficiencyId: 'd3', workflowStatus: 'Ineffective', status: 'Open', dueDate: Date.now() + 86400000 * 30 },
  { id: 'ap4', deficiencyId: 'd4', workflowStatus: 'Ineffective', status: 'Open', dueDate: Date.now() + 86400000 * 30 },
  { id: 'ap5', deficiencyId: 'd5', workflowStatus: 'Ineffective', status: 'Open', dueDate: Date.now() + 86400000 * 30 },
];

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'deficiencies') return { data: { items: deficiencies }, isLoading: false };
    if (queryKey[0] === 'actionplans') return { data: { items: actionPlans }, isLoading: false };
    return { data: { items: [] }, isLoading: false };
  }),
  useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'Admin' } }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: unknown) =>
      typeof opts === 'string' ? opts : ((opts as { defaultValue?: string })?.defaultValue || key),
  }),
}));

/** Desktop Kanban wrapper only — the mobile stream duplicates every card. */
function desktop(container: HTMLElement) {
  return within(container.querySelector('[data-testid="deficiency-kanban-desktop"]') as HTMLElement);
}

function mobile(container: HTMLElement) {
  return within(container.querySelector('[data-testid="deficiency-mobile-tabs"]') as HTMLElement);
}

describe('DeficiencyBoard Mobile Tabs', () => {
  it('renders only the desktop kanban tree at desktop width', () => {
    const { container } = renderBoard();
    expect(container.querySelector('[data-testid="deficiency-kanban-desktop"]')).not.toBeNull();
    // The inactive viewport tree must be unmounted (single DnD identity set).
    expect(container.querySelector('[data-testid="deficiency-mobile-tabs"]')).toBeNull();
  });

  it('renders only the mobile tree at mobile width', () => {
    setViewportWidth(500);
    const { container } = renderBoard();
    expect(container.querySelector('[data-testid="deficiency-mobile-tabs"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="deficiency-kanban-desktop"]')).toBeNull();
  });

  it('switches status streams without page-level horizontal scroll', () => {
    setViewportWidth(500);
    const { container } = renderBoard();
    const m = mobile(container);

    expect(m.getByText('Kontrol Kas Kecil')).toBeInTheDocument();
    expect(m.queryByText('Kontrol Rekonsiliasi')).toBeNull();

    fireEvent.click(m.getByRole('tab', { name: /In Review/ }));
    expect(m.getByText('Kontrol Rekonsiliasi')).toBeInTheDocument();
    expect(m.queryByText('Kontrol Kas Kecil')).toBeNull();
  });

  it('uses minimum 12px type across the board (no sub-12px utilities)', () => {
    const { container } = renderBoard();
    expect(container.querySelectorAll('[class*="text-[10px]"]').length).toBe(0);
    expect(container.querySelectorAll('[class*="text-[11px]"]').length).toBe(0);
    expect(container.querySelectorAll('[class*="text-[9px]"]').length).toBe(0);
    expect(container.querySelectorAll('[class*="text-[8px]"]').length).toBe(0);
  });

  it('keeps card actions visible with touch-sized targets on mobile', () => {
    setViewportWidth(500);
    const { container } = renderBoard();
    const actionButtons = mobile(container).getAllByRole('button', { name: 'Action Plan' });
    expect(actionButtons.length).toBeGreaterThan(0);
    actionButtons.forEach((button) => {
      expect(button.closest('.opacity-0')).toBeNull();
    });
  });

  it('registers exactly one droppable per SK-5 kanban column on desktop', () => {
    const { container } = renderBoard();
    const droppables = container.querySelectorAll('[data-droppable-id]');
    // Single mounted tree: no duplicate DnD identities.
    expect(droppables.length).toBe(4);
    const dropIds = Array.from(droppables).map((el) => el.getAttribute('data-droppable-id'));
    expect(dropIds).toContain('Ineffective');
    expect(dropIds).toContain('In Review');
    expect(dropIds).toContain('In Approval');
    expect(dropIds).toContain('Resolved');
  });

  it('registers a single droppable for the active mobile stream', () => {
    setViewportWidth(500);
    const { container } = renderBoard();
    const droppables = container.querySelectorAll('[data-droppable-id]');
    expect(droppables.length).toBe(1);
    expect(droppables[0].getAttribute('data-droppable-id')).toBe('Ineffective');
  });
});

describe('DeficiencyBoard granular source filtering', () => {
  const CLICK_FILTER = (result: RenderResult, name: string) =>
    fireEvent.click(result.getByRole('button', { name }));

  it('exposes exactly the five granular source filters', () => {
    const { getByRole } = renderBoard();
    ['All', 'CSA Ineffective', 'TOD Review (Design)', 'TOE Review (Operation)', 'External / SPI Audit'].forEach(
      (label) => expect(getByRole('button', { name: label })).toBeInTheDocument()
    );
  });

  it('shows every origin when the All filter is active', () => {
    const { container } = renderBoard();
    const board = desktop(container);

    expect(board.getByText('Kontrol Kas Kecil')).toBeInTheDocument();
    expect(board.getByText('Kontrol Rekonsiliasi')).toBeInTheDocument();
    expect(board.getByText('Kontrol Persediaan')).toBeInTheDocument();
    expect(board.getByText('Kontrol Piutang')).toBeInTheDocument();
    expect(board.getByText('Kontrol Pendapatan')).toBeInTheDocument();
  });

  it('shows only Lini 1 - CSA findings under the CSA filter', () => {
    const result = renderBoard();
    CLICK_FILTER(result, 'CSA Ineffective');
    const board = desktop(result.container);

    expect(board.getByText('Kontrol Kas Kecil')).toBeInTheDocument();
    expect(board.queryByText('Kontrol Rekonsiliasi')).toBeNull();
    expect(board.queryByText('Kontrol Persediaan')).toBeNull();
    expect(board.queryByText('Kontrol Piutang')).toBeNull();
    expect(board.queryByText('Kontrol Pendapatan')).toBeNull();
  });

  it('shows only Lini 2 - TOD Review findings under the TOD filter', () => {
    const result = renderBoard();
    CLICK_FILTER(result, 'TOD Review (Design)');
    const board = desktop(result.container);

    expect(board.getByText('Kontrol Rekonsiliasi')).toBeInTheDocument();
    expect(board.queryByText('Kontrol Kas Kecil')).toBeNull();
    expect(board.queryByText('Kontrol Persediaan')).toBeNull();
    expect(board.queryByText('Kontrol Piutang')).toBeNull();
    expect(board.queryByText('Kontrol Pendapatan')).toBeNull();
  });

  it('groups both TOE Review and legacy CSA Validation origins under the TOE filter', () => {
    const result = renderBoard();
    CLICK_FILTER(result, 'TOE Review (Operation)');
    const board = desktop(result.container);

    expect(board.getByText('Kontrol Persediaan')).toBeInTheDocument();
    expect(board.getByText('Kontrol Piutang')).toBeInTheDocument();
    expect(board.queryByText('Kontrol Kas Kecil')).toBeNull();
    expect(board.queryByText('Kontrol Rekonsiliasi')).toBeNull();
    expect(board.queryByText('Kontrol Pendapatan')).toBeNull();
  });

  it('shows only Lini 3 - Audit findings under the Audit filter', () => {
    const result = renderBoard();
    CLICK_FILTER(result, 'External / SPI Audit');
    const board = desktop(result.container);

    expect(board.getByText('Kontrol Pendapatan')).toBeInTheDocument();
    expect(board.queryByText('Kontrol Kas Kecil')).toBeNull();
    expect(board.queryByText('Kontrol Rekonsiliasi')).toBeNull();
    expect(board.queryByText('Kontrol Persediaan')).toBeNull();
    expect(board.queryByText('Kontrol Piutang')).toBeNull();
  });

  it('restores the full set when the All filter is reselected', () => {
    const result = renderBoard();
    CLICK_FILTER(result, 'CSA Ineffective');
    CLICK_FILTER(result, 'All');

    const board = desktop(result.container);
    expect(board.getByText('Kontrol Kas Kecil')).toBeInTheDocument();
    expect(board.getByText('Kontrol Rekonsiliasi')).toBeInTheDocument();
    expect(board.getByText('Kontrol Persediaan')).toBeInTheDocument();
    expect(board.getByText('Kontrol Piutang')).toBeInTheDocument();
    expect(board.getByText('Kontrol Pendapatan')).toBeInTheDocument();
  });

  it('flags the active filter for assistive tech via aria-pressed', () => {
    const result = renderBoard();

    expect(result.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    CLICK_FILTER(result, 'TOE Review (Operation)');

    expect(result.getByRole('button', { name: 'TOE Review (Operation)' })).toHaveAttribute('aria-pressed', 'true');
    expect(result.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('resolveWorkflowAction (SK-5 drag transition matrix)', () => {
  it('maps Ineffective -> In Review to Submit for Line 1 and Admin', () => {
    for (const role of ['Line 1', 'Admin']) {
      const res = resolveWorkflowAction('Ineffective', 'In Review', role);
      expect(res).toMatchObject({ action: 'Submit' });
      expect((res as { note: string }).note).toContain('In Review');
    }
  });

  it('blocks Ineffective -> In Review for Line 2', () => {
    const res = resolveWorkflowAction('Ineffective', 'In Review', 'Line 2');
    expect(res).toHaveProperty('error');
    expect((res as { error: string }).error).not.toBe('same-status');
  });

  it('maps In Review -> In Approval to Review for Line 2 and Admin', () => {
    for (const role of ['Line 2', 'Admin']) {
      expect(resolveWorkflowAction('In Review', 'In Approval', role)).toMatchObject({ action: 'Review' });
    }
  });

  it('blocks In Review -> In Approval for Line 1', () => {
    expect(resolveWorkflowAction('In Review', 'In Approval', 'Line 1')).toHaveProperty('error');
  });

  it('maps In Approval -> Resolved to Approve for Admin only', () => {
    expect(resolveWorkflowAction('In Approval', 'Resolved', 'Admin')).toMatchObject({ action: 'Approve' });
    expect(resolveWorkflowAction('In Approval', 'Resolved', 'Line 1')).toHaveProperty('error');
    expect(resolveWorkflowAction('In Approval', 'Resolved', 'Line 2')).toHaveProperty('error');
  });

  it('maps any status -> Ineffective to Reject, and Resolved -> Ineffective to Rollback', () => {
    expect(resolveWorkflowAction('In Review', 'Ineffective', 'Line 1')).toMatchObject({ action: 'Reject' });
    expect(resolveWorkflowAction('Resolved', 'Ineffective', 'Admin')).toMatchObject({ action: 'Rollback' });
  });

  it('allows Admin direct jumps and blocks them for other roles', () => {
    expect(resolveWorkflowAction('Ineffective', 'Resolved', 'Admin')).toMatchObject({ action: 'Approve' });
    expect(resolveWorkflowAction('Ineffective', 'Resolved', 'Line 1')).toHaveProperty('error');
  });

  it('returns same-status without a user-facing error', () => {
    expect(resolveWorkflowAction('In Review', 'In Review', 'Admin')).toEqual({ error: 'same-status' });
  });
});

describe('DeficiencyCard source badge', () => {
  /** TOE Review and legacy CSA Validation collapse to one label, so it appears twice. */
  const BADGE_COUNTS: Record<string, number> = {
    'CSA Ineffective': 1,
    'TOD Review (Design)': 1,
    'TOE Review (Operation)': 2,
    'External / SPI Audit': 1,
  };

  it('tags each card with its own origin label', () => {
    const { container } = renderBoard();
    const board = desktop(container);

    Object.entries(BADGE_COUNTS).forEach(([label, count]) => {
      expect(board.getAllByText(label)).toHaveLength(count);
    });
  });

  it('renders an icon alongside every source badge label', () => {
    const { container } = renderBoard();
    const board = desktop(container);

    Object.keys(BADGE_COUNTS).forEach((label) => {
      board.getAllByText(label).forEach((badge) => {
        expect(badge.querySelector('svg')).not.toBeNull();
      });
    });
  });

  it('uses institutional radius and caps badge type at 12px', () => {
    const { container } = renderBoard();
    const board = desktop(container);

    board.getAllByText('CSA Ineffective').forEach((badge) => {
      expect(badge.className).toContain('rounded-md');
      expect(badge.className).toContain('text-xs');
      expect(badge.className).not.toMatch(/rounded-(xl|2xl|3xl|full)/);
    });
  });

  it('gives each origin a distinct institutional color treatment', () => {
    const { container } = renderBoard();
    const board = desktop(container);

    const classes = Object.keys(BADGE_COUNTS).flatMap((label) =>
      board.getAllByText(label).map((badge) => badge.className)
    );

    // Two TOE origins intentionally share one treatment; the four origins must not collide.
    expect(new Set(classes).size).toBe(4);
    classes.forEach((className) => {
      expect(className).toMatch(/border-\w+-\d00/);
      expect(className).not.toMatch(/backdrop-blur/);
    });
  });
});
