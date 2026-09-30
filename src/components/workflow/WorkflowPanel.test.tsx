import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowPanel } from './WorkflowPanel';
import React from 'react';

vi.stubEnv('VITE_ENABLE_WORKFLOW_APPROVAL', 'true');

vi.mock('@/hooks/use-workflow', () => ({
  useWorkflow: vi.fn().mockReturnValue({
    executeAction: vi.fn(),
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
    i18n: { language: 'id' },
  }),
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
});
