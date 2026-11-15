import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BPMSelectionHUD } from '../BPMSelectionHUD';
import { strictT } from '@/test/mock-i18n';
import type { Edge } from 'reactflow';

// Mock reactflow Panel component
vi.mock('reactflow', () => ({
  Panel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="rf-panel" className={className}>{children}</div>
  ),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
  }),
}));

describe('BPMSelectionHUD component', () => {
  const mockEdge: Edge = {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    label: 'Initial Label',
  };

  it('ignores Enter key on edge label input during active IME composition', () => {
    const onUpdateEdgeLabel = vi.fn();
    render(
      <BPMSelectionHUD
        selectedEdge={mockEdge}
        isLocked={false}
        onToggleLock={vi.fn()}
        onDeleteSelected={vi.fn()}
        onClearSelection={vi.fn()}
        onUpdateEdgeLabel={onUpdateEdgeLabel}
      />
    );

    const input = screen.getByLabelText('Connection label');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Initial Label');

    fireEvent.change(input, { target: { value: 'Updated Label' } });

    // Enter with isComposing = true should not blur/commit immediately
    const blurSpy = vi.spyOn(input, 'blur');
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(blurSpy).not.toHaveBeenCalled();

    // Enter with isComposing = false blurs and commits
    fireEvent.keyDown(input, { key: 'Enter', isComposing: false });
    expect(blurSpy).toHaveBeenCalled();
  });
});
