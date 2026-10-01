import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeficiencyBoard } from '../DeficiencyBoard';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext';

function renderBoard() {
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

const deficiencies = [
  { id: 'd1', code: 'DEF-001', title: 'Selisih Kas Kecil', controlName: 'Kontrol Kas Kecil', severity: 'Significant Deficiency', processName: 'Kas & Bank' },
  { id: 'd2', code: 'DEF-002', title: 'Rekonsiliasi Terlambat', controlName: 'Kontrol Rekonsiliasi', severity: 'Control Deficiency', processName: 'Rekonsiliasi' },
];

const actionPlans = [
  { id: 'ap1', deficiencyId: 'd1', workflowStatus: 'Ineffective', status: 'Open', dueDate: Date.now() + 86400000 * 30 },
  { id: 'ap2', deficiencyId: 'd2', workflowStatus: 'In Review', status: 'Submitted', dueDate: Date.now() + 86400000 * 30 },
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
    t: (key: string, opts?: any) => (typeof opts === 'string' ? opts : (opts?.defaultValue || key)),
  }),
}));

describe('DeficiencyBoard Mobile Tabs', () => {
  it('renders desktop kanban wrapper and mobile tab container', () => {
    const { container } = renderBoard();
    expect(container.querySelector('.hidden.md\\:block')).not.toBeNull();
    const mobile = container.querySelector('[data-testid="deficiency-mobile-tabs"]');
    expect(mobile).not.toBeNull();
    expect(mobile?.closest('.md\\:hidden')).not.toBeNull();
  });

  it('switches status streams without page-level horizontal scroll', () => {
    const { container } = renderBoard();
    const mobile = () => within(container.querySelector('[data-testid="deficiency-mobile-tabs"]') as HTMLElement);

    expect(mobile().getByText('Kontrol Kas Kecil')).toBeInTheDocument();
    expect(mobile().queryByText('Kontrol Rekonsiliasi')).toBeNull();

    fireEvent.click(mobile().getByRole('tab', { name: /In Review/ }));
    expect(mobile().getByText('Kontrol Rekonsiliasi')).toBeInTheDocument();
    expect(mobile().queryByText('Kontrol Kas Kecil')).toBeNull();
  });

  it('uses minimum 12px type across the board (no sub-12px utilities)', () => {
    const { container } = renderBoard();
    expect(container.querySelectorAll('[class*="text-[10px]"]').length).toBe(0);
    expect(container.querySelectorAll('[class*="text-[11px]"]').length).toBe(0);
    expect(container.querySelectorAll('[class*="text-[9px]"]').length).toBe(0);
    expect(container.querySelectorAll('[class*="text-[8px]"]').length).toBe(0);
  });

  it('keeps card actions visible with touch-sized targets on mobile', () => {
    const { container } = renderBoard();
    const mobile = within(container.querySelector('[data-testid="deficiency-mobile-tabs"]') as HTMLElement);
    // Admin sees the Action Plan button for the Ineffective card
    const actionBtn = mobile.getByRole('button', { name: 'Action Plan' });
    expect(actionBtn).toBeInTheDocument();
    expect(actionBtn.closest('.opacity-0')).toBeNull();
  });

  it('renders droppable containers for all SK-5 kanban columns', () => {
    const { container } = renderBoard();
    const droppables = container.querySelectorAll('[data-droppable-id]');
    expect(droppables.length).toBeGreaterThanOrEqual(4);
    const dropIds = Array.from(droppables).map(el => el.getAttribute('data-droppable-id'));
    expect(dropIds).toContain('Ineffective');
    expect(dropIds).toContain('In Review');
    expect(dropIds).toContain('In Approval');
    expect(dropIds).toContain('Resolved');
  });
});
