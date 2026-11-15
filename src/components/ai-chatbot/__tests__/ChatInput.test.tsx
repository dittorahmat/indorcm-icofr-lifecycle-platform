import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '../ChatInput';

describe('ChatInput component', () => {
  it('renders textarea and submit button', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} placeholder="Ketik pesan..." />);

    const textarea = screen.getByPlaceholderText('Ketik pesan...');
    expect(textarea).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('sends message on Enter when not composing', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Tanyakan tentang ICOFR...');
    fireEvent.change(textarea, { target: { value: 'Halo ICOFR' } });

    // Enter with isComposing = true should NOT send
    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: true });
    expect(onSend).not.toHaveBeenCalled();

    // Enter with isComposing = false sends message
    fireEvent.keyDown(textarea, { key: 'Enter', isComposing: false });
    expect(onSend).toHaveBeenCalledWith('Halo ICOFR');
    expect(textarea).toHaveValue('');
  });

  it('allows newline on Shift+Enter', () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('Tanyakan tentang ICOFR...');
    fireEvent.change(textarea, { target: { value: 'Line 1' } });

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('uses declarative [field-sizing:content] styling', () => {
    render(<ChatInput onSend={vi.fn()} />);
    const textarea = screen.getByPlaceholderText('Tanyakan tentang ICOFR...');
    expect(textarea.className).toContain('[field-sizing:content]');
    expect(textarea.className).toContain('max-h-[120px]');
    expect(textarea.className).toContain('min-h-[44px]');
  });
});
