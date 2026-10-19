import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TodoScheduleDialog, type TodoScheduleFormData } from '../TodoScheduleDialog';
import { TodoRescheduleDialog, type TodoRescheduleData } from '../TodoRescheduleDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/use-confirm', () => ({
  useConfirm: () => vi.fn(() => Promise.resolve(true)),
}));

describe('TodoScheduleDialog', () => {
  const defaultFormData: TodoScheduleFormData = {
    bpmProcessId: 'proc-1',
    description: 'Quarterly review',
    type: 'CSA',
    plannedDate: '2025-06-15',
    reminderConfig: { value: 3, unit: 'day' },
  };

  it('renders correctly when open', () => {
    const onOpenChange = vi.fn();
    const onUpdateFormData = vi.fn();
    const onSubmit = vi.fn();
    const onReset = vi.fn();

    render(
      <TodoScheduleDialog
        isOpen={true}
        isEditMode={false}
        isDirty={false}
        formData={defaultFormData}
        onOpenChange={onOpenChange}
        onUpdateFormData={onUpdateFormData}
        onSubmit={onSubmit}
        onReset={onReset}
      />
    );

    expect(screen.getByDisplayValue('Quarterly review')).toBeDefined();
    expect(screen.getByDisplayValue('2025-06-15')).toBeDefined();
  });

  it('calls onUpdateFormData when description changes', () => {
    const onOpenChange = vi.fn();
    const onUpdateFormData = vi.fn();
    const onSubmit = vi.fn();
    const onReset = vi.fn();

    render(
      <TodoScheduleDialog
        isOpen={true}
        isEditMode={false}
        isDirty={false}
        formData={defaultFormData}
        onOpenChange={onOpenChange}
        onUpdateFormData={onUpdateFormData}
        onSubmit={onSubmit}
        onReset={onReset}
      />
    );

    const descInput = screen.getByDisplayValue('Quarterly review');
    fireEvent.change(descInput, { target: { value: 'Updated description' } });
    expect(onUpdateFormData).toHaveBeenCalledWith({ description: 'Updated description' });
  });

  it('submits the form on button click', () => {
    const onOpenChange = vi.fn();
    const onUpdateFormData = vi.fn();
    const onSubmit = vi.fn();
    const onReset = vi.fn();

    render(
      <TodoScheduleDialog
        isOpen={true}
        isEditMode={false}
        isDirty={false}
        formData={defaultFormData}
        onOpenChange={onOpenChange}
        onUpdateFormData={onUpdateFormData}
        onSubmit={onSubmit}
        onReset={onReset}
      />
    );

    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find(b => b.textContent?.includes('save') || b.textContent?.includes('simpan'));
    expect(submitBtn).toBeDefined();
    if (submitBtn) fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalled();
  });
});

describe('TodoRescheduleDialog', () => {
  const defaultRescheduleData: TodoRescheduleData = {
    newDate: '2025-07-01',
    justification: 'Auditor request',
  };

  it('renders correctly when open', () => {
    const onOpenChange = vi.fn();
    const onUpdateRescheduleData = vi.fn();
    const onSubmit = vi.fn();

    render(
      <TodoRescheduleDialog
        isOpen={true}
        isRescheduleDirty={false}
        rescheduleData={defaultRescheduleData}
        onOpenChange={onOpenChange}
        onUpdateRescheduleData={onUpdateRescheduleData}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByDisplayValue('2025-07-01')).toBeDefined();
    expect(screen.getByDisplayValue('Auditor request')).toBeDefined();
  });

  it('calls onUpdateRescheduleData when justification changes', () => {
    const onOpenChange = vi.fn();
    const onUpdateRescheduleData = vi.fn();
    const onSubmit = vi.fn();

    render(
      <TodoRescheduleDialog
        isOpen={true}
        isRescheduleDirty={false}
        rescheduleData={defaultRescheduleData}
        onOpenChange={onOpenChange}
        onUpdateRescheduleData={onUpdateRescheduleData}
        onSubmit={onSubmit}
      />
    );

    const input = screen.getByDisplayValue('Auditor request');
    fireEvent.change(input, { target: { value: 'Management request' } });
    expect(onUpdateRescheduleData).toHaveBeenCalledWith({ justification: 'Management request' });
  });

  it('submits the reschedule dialog on button click', () => {
    const onOpenChange = vi.fn();
    const onUpdateRescheduleData = vi.fn();
    const onSubmit = vi.fn();

    render(
      <TodoRescheduleDialog
        isOpen={true}
        isRescheduleDirty={false}
        rescheduleData={defaultRescheduleData}
        onOpenChange={onOpenChange}
        onUpdateRescheduleData={onUpdateRescheduleData}
        onSubmit={onSubmit}
      />
    );

    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find(b => b.textContent?.includes('save') || b.textContent?.includes('simpan'));
    expect(submitBtn).toBeDefined();
    if (submitBtn) fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalled();
  });
});
