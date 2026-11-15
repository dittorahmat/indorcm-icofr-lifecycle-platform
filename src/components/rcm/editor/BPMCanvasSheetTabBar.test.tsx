import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BPMCanvasSheetTabBar } from './BPMCanvasSheetTabBar';

describe('BPMCanvasSheetTabBar component', () => {
  const mockSheets = [
    { id: 's-1', name: 'Fase 1', order: 0, nodes: [], edges: [] },
    { id: 's-2', name: 'Fase 2', order: 1, nodes: [], edges: [] },
  ];

  it('renders all sheet tabs and highlights active sheet', () => {
    const onSelectSheet = vi.fn();
    render(
      <BPMCanvasSheetTabBar
        sheets={mockSheets}
        activeSheetId="s-1"
        onSelectSheet={onSelectSheet}
        onAddSheet={vi.fn()}
        onRenameSheet={vi.fn()}
        onRemoveSheet={vi.fn()}
      />
    );

    expect(screen.getByText('Fase 1')).toBeInTheDocument();
    expect(screen.getByText('Fase 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Fase 2'));
    expect(onSelectSheet).toHaveBeenCalledWith('s-2');
  });

  it('triggers onAddSheet when clicking Add Sheet button', () => {
    const onAddSheet = vi.fn();
    render(
      <BPMCanvasSheetTabBar
        sheets={mockSheets}
        activeSheetId="s-1"
        onSelectSheet={vi.fn()}
        onAddSheet={onAddSheet}
        onRenameSheet={vi.fn()}
        onRemoveSheet={vi.fn()}
      />
    );

    const addBtn = screen.getByText('Tambah Sheet');
    fireEvent.click(addBtn);
    expect(onAddSheet).toHaveBeenCalled();
  });

  it('ignores Enter key while IME composition is active during rename', () => {
    const onRenameSheet = vi.fn();
    render(
      <BPMCanvasSheetTabBar
        sheets={mockSheets}
        activeSheetId="s-1"
        onSelectSheet={vi.fn()}
        onAddSheet={vi.fn()}
        onRenameSheet={onRenameSheet}
        onRemoveSheet={vi.fn()}
      />
    );

    const renameBtn = screen.getByLabelText('Rename Fase 1');
    fireEvent.click(renameBtn);

    const input = screen.getByDisplayValue('Fase 1');
    fireEvent.change(input, { target: { value: 'Fase Baru' } });

    // Press Enter while isComposing = true
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onRenameSheet).not.toHaveBeenCalled();

    // Press Enter while isComposing = false
    fireEvent.keyDown(input, { key: 'Enter', isComposing: false });
    expect(onRenameSheet).toHaveBeenCalledWith('s-1', 'Fase Baru');
  });
});
