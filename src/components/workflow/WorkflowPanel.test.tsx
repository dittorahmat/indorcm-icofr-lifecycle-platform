import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowPanel } from './WorkflowPanel';
import React from 'react';

vi.stubEnv('VITE_ENABLE_WORKFLOW_APPROVAL', 'false');

const { executeActionMock, beforeActionMock } = vi.hoisted(() => ({
  executeActionMock: vi.fn(),
  beforeActionMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/hooks/use-workflow', () => ({
  useWorkflow: vi.fn().mockReturnValue({
    executeAction: executeActionMock,
    isPending: false,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: [{ id: 'user-1', name: 'Budi Reviewer', role: 'Line 2' }],
    isLoading: false,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
    i18n: { language: 'id' },
  }),
}));

vi.mock('@/hooks/use-current-role', () => ({
  useCurrentRole: vi.fn().mockReturnValue('Line 2'),
  useCurrentUser: vi.fn().mockReturnValue({ data: { id: 'user-1', role: 'Line 2' } }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn().mockReturnValue(true),
}));

describe('WorkflowPanel Mobile Support', () => {
  it('renders quick note presets when action dialog opens', async () => {
    render(
      <WorkflowPanel
        entityType="BPM"
        entityId="proc-1"
        currentStatus="In Review"
        history={[]}
      />
    );

    // Click Reject which triggers note dialog
    const rejectButton = screen.getByRole('button', { name: /status\.rejected/i });
    fireEvent.click(rejectButton);

    // In mobile mode, quick note preset buttons should be visible
    expect(await screen.findByText(/\+ Disetujui sesuai lampiran/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Mohon lengkapi bukti sampel/i)).toBeInTheDocument();
  });

  it('invokes beforeAction exactly once across dialog open + confirm', async () => {
    beforeActionMock.mockClear();
    executeActionMock.mockClear();
    render(
      <WorkflowPanel
        entityType="BPM"
        entityId="proc-1"
        currentStatus="In Review"
        history={[]}
        beforeAction={beforeActionMock}
      />
    );

    const rejectButtons = screen.getAllByRole('button', { name: /status\.rejected/i });
    fireEvent.click(rejectButtons[rejectButtons.length - 1]);
    expect(beforeActionMock).toHaveBeenCalledTimes(1);

    const noteBox = await screen.findByPlaceholderText('workflow:reasonPlaceholder');
    fireEvent.change(noteBox, { target: { value: 'needs rework' } });
    const confirmButtons = screen.getAllByRole('button', { name: 'workflow:confirmAction' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(beforeActionMock).toHaveBeenCalledTimes(1);
    expect(executeActionMock).toHaveBeenCalledWith(
      { action: 'Reject', note: 'needs rework', assigneeId: undefined },
      expect.anything(),
    );
  });

  it('never renders a demo bypass even when approval is disabled via env', () => {
    render(
      <WorkflowPanel
        entityType="BPM"
        entityId="proc-1"
        currentStatus="Draft"
        history={[]}
      />
    );

    expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bypass/i)).not.toBeInTheDocument();
  });

  it('allows action to proceed with beforeAction even when isDirty is true', async () => {
    beforeActionMock.mockClear();
    executeActionMock.mockClear();
    render(
      <WorkflowPanel
        entityType="BPM"
        entityId="proc-1"
        currentStatus="In Review"
        history={[]}
        isDirty={true}
        beforeAction={beforeActionMock}
      />
    );

    const rejectButtons = screen.getAllByRole('button', { name: /status\.rejected/i });
    fireEvent.click(rejectButtons[rejectButtons.length - 1]);
    expect(beforeActionMock).toHaveBeenCalledTimes(1);
  });

  it('disables approval button when current user is the creator (SoD strict)', () => {
    render(
      <WorkflowPanel
        entityType="BPM"
        entityId="proc-1"
        currentStatus="In Review"
        history={[]}
        createdBy="user-1"
      />
    );

    const reviewButton = screen.getByRole('button', { name: 'workflow:passReview' });
    expect(reviewButton).toBeDisabled();
    expect(reviewButton).toHaveAttribute('title', 'workflow:sodViolationTooltip');
  });
});
