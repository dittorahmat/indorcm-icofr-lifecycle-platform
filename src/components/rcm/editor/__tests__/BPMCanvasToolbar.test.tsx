import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BPMCanvasToolbar } from '../BPMCanvasToolbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      if (key === 'bpm:editor.actions.save') return 'Save Workflow';
      if (key === 'bpm:editor.actions.saving') return 'Saving...';
      if (key === 'bpm:editor.actions.locked') return 'Locked';
      if (key === 'bpm:editor.actions.undo') return 'Undo';
      if (key === 'bpm:editor.actions.redo') return 'Redo';
      return opts?.defaultValue ?? key;
    },
  }),
}));

describe('BPMCanvasToolbar responsive split cluster & Save CTA visibility', () => {
  const dummyProps = {
    canUndo: true,
    canRedo: false,
    isLocked: false,
    isSaving: false,
    hasNodes: true,
    globalScale: 100,
    selectedGLs: [],
    glOptions: [],
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onOpenDocumentView: vi.fn(),
    onOpenOcrDialog: vi.fn(),
    onScaleChange: vi.fn(),
    onSelectedGLsChange: vi.fn(),
    onSwitchGLContext: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders Save CTA inside a dedicated shrink-0 right cluster isolated from scrollable tools', () => {
    const { container } = render(<BPMCanvasToolbar {...dummyProps} />);

    // Save button must exist
    const saveButton = screen.getByRole('button', { name: /Save Workflow/i });
    expect(saveButton).toBeInTheDocument();

    // Verify parent right-cluster container has shrink-0 and border-l styling
    const rightCluster = saveButton.closest('div');
    expect(rightCluster).toBeInTheDocument();
    expect(rightCluster?.className).toContain('shrink-0');
    expect(rightCluster?.className).toContain('border-l');

    // Verify left cluster has flex-1, min-w-0, and overflow-x-auto
    const leftCluster = container.querySelector('.overflow-x-auto');
    expect(leftCluster).toBeInTheDocument();
    expect(leftCluster?.className).toContain('flex-1');
    expect(leftCluster?.className).toContain('min-w-0');

    // Verify Auto Arrange button is permanently gone
    expect(screen.queryByText(/Auto Arrange/i)).not.toBeInTheDocument();
  });

  it('renders locked badge inside the persistent right cluster when isLocked is true', () => {
    render(<BPMCanvasToolbar {...dummyProps} isLocked={true} />);

    const lockedBadge = screen.getByText('Locked');
    expect(lockedBadge).toBeInTheDocument();
  });
});
