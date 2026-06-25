import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BPMCanvasFooter } from '../nodes/BPMCanvasLayout';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import React from 'react';

const mockSignatures = {
  lini1Name: 'Alice',
  lini1Date: '01/01/2026',
  lini2Name: 'Bob',
  lini2Date: '02/01/2026',
  cfoName: 'Charlie',
  cfoDate: '03/01/2026',
};

describe('BPMCanvasFooter Signature Component', () => {
  it('renders signature names and dates correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BPMCanvasFooter signatures={mockSignatures} />
      </I18nextProvider>
    );

    // Verify Lini 1 Name and Date
    const lini1NameInput = screen.getByPlaceholderText(/Preparer Name/i);
    expect(lini1NameInput).toHaveValue('Alice');

    // Verify Lini 2 Name
    const lini2NameInput = screen.getByPlaceholderText(/Reviewer Name/i);
    expect(lini2NameInput).toHaveValue('Bob');

    // Verify CFO Name
    const cfoNameInput = screen.getByPlaceholderText(/CFO Name/i);
    expect(cfoNameInput).toHaveValue('Charlie');
  });

  it('calls onChangeSignature when inputs are modified', async () => {
    const handleChangeSignature = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <BPMCanvasFooter signatures={mockSignatures} onChangeSignature={handleChangeSignature} />
      </I18nextProvider>
    );

    const lini1NameInput = screen.getByPlaceholderText(/Preparer Name/i);
    await user.type(lini1NameInput, 'X');

    expect(handleChangeSignature).toHaveBeenCalledWith('lini1Name', 'AliceX');
  });

  it('disables input fields when isLocked is true', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BPMCanvasFooter signatures={mockSignatures} isLocked={true} />
      </I18nextProvider>
    );

    const lini1NameInput = screen.getByPlaceholderText(/Preparer Name/i);
    const lini1DateInput = screen.getAllByPlaceholderText(/Date \(DD\/MM\/YYYY\)/i)[0];

    expect(lini1NameInput).toBeDisabled();
    expect(lini1DateInput).toBeDisabled();
  });

  it('has print CSS classes to hide borders and backgrounds when exporting/printing', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BPMCanvasFooter signatures={mockSignatures} />
      </I18nextProvider>
    );

    const lini1NameInput = screen.getByPlaceholderText(/Preparer Name/i);
    expect(lini1NameInput.className).toContain('print:border-none');
    expect(lini1NameInput.className).toContain('print:bg-transparent');
    expect(lini1NameInput.className).toContain('print:placeholder-transparent');
  });
});
