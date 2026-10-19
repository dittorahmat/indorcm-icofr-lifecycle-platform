import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TodoTaskSidebar } from '../TodoTaskSidebar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue || key,
    i18n: { language: 'en' },
  }),
}));

describe('TodoTaskSidebar', () => {
  const baseDate = new Date('2026-06-15T10:00:00');

  it('renders calendar and empty state when there are no tasks', () => {
    render(
      <TodoTaskSidebar
        currentDate={baseDate}
        onSelectDate={vi.fn()}
        onMonthChange={vi.fn()}
        monthlyTaskSummary={[]}
        onOpenHub={vi.fn()}
        onEditClick={vi.fn()}
        onDeleteClick={vi.fn()}
      />
    );

    expect(screen.getByText('common:calendar.noTasks')).toBeDefined();
  });

  it('renders tasks and triggers actions from popover', () => {
    const onOpenHub = vi.fn();
    const onEditClick = vi.fn();
    const onDeleteClick = vi.fn();

    const taskDate = new Date('2026-06-20T10:00:00');
    const mockEvents = [
      {
        id: 'event-1',
        displayTitle: 'Test Event Alpha',
        type: 'CSA',
        status: 'Pending',
        plannedDate: '2026-06-20',
        eventType: 'SCHEDULE',
        bpmProcessId: 'proc-1',
      },
    ];

    render(
      <TodoTaskSidebar
        currentDate={baseDate}
        onSelectDate={vi.fn()}
        onMonthChange={vi.fn()}
        monthlyTaskSummary={[{ day: taskDate, events: mockEvents }]}
        onOpenHub={onOpenHub}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />
    );

    expect(screen.getByText('Test Event Alpha')).toBeDefined();

    // Click to open popover
    fireEvent.click(screen.getByText('Test Event Alpha'));

    // Check actions inside popover
    const executeBtn = screen.getByText('csa_hub:actions.execute');
    expect(executeBtn).toBeDefined();
    fireEvent.click(executeBtn);
    expect(onOpenHub).toHaveBeenCalledWith(mockEvents[0]);

    const editBtn = screen.getByText('Edit Details');
    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn);
    expect(onEditClick).toHaveBeenCalledWith(mockEvents[0]);

    const deleteBtn = screen.getByText('Remove Schedule');
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn);
    expect(onDeleteClick).toHaveBeenCalledWith('event-1');
  });
});
