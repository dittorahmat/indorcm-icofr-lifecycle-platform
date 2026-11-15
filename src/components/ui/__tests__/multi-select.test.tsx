import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultiSelect } from '../multi-select';

describe('MultiSelect component', () => {
  const options = [
    { value: 'opt-1', label: 'Option 1' },
    { value: 'opt-2', label: 'Option 2' },
  ];

  it('ignores Enter key on badge remove button during IME composition', () => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={options}
        selected={['opt-1']}
        onChange={onChange}
      />
    );

    const removeBtn = screen.getByRole('button', { name: '' });
    expect(removeBtn).toBeInTheDocument();

    // Enter with isComposing = true should NOT unselect
    fireEvent.keyDown(removeBtn, { key: 'Enter', isComposing: true });
    expect(onChange).not.toHaveBeenCalled();

    // Enter with isComposing = false unselects option
    fireEvent.keyDown(removeBtn, { key: 'Enter', isComposing: false });
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
