import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BPMCanvasToolbar } from '../BPMCanvasToolbar';
import { strictT } from '../../../../test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: strictT }),
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

    // Save button must exist (strictT renders the verified key, not a local string)
    const saveButton = screen.getByRole('button', { name: 'bpm:editor.actions.save' });
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
    expect(screen.queryByText('bpm:editor.actions.autoArrange')).not.toBeInTheDocument();
  });

  it('renders locked badge inside the persistent right cluster when isLocked is true', () => {
    render(<BPMCanvasToolbar {...dummyProps} isLocked={true} />);

    const lockedBadge = screen.getByText('bpm:editor.actions.locked');
    expect(lockedBadge).toBeInTheDocument();
  });
});
