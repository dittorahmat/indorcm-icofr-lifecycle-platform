import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RolloverPrompt } from '../RolloverPrompt';

// Mock react-i18next
import { validateI18nKey } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      validateI18nKey(key);
      if (key === 'rollover.title') return 'Rollover Fiscal Year Data';
      if (key === 'rollover.description') {
        return `No data found for the selected fiscal year ${options?.year}. Would you like to copy from previous year ${options?.prevYear}?`;
      }
      if (key === 'rollover.confirm') return 'Carry Forward / Copy Data';
      if (key === 'rollover.cancel') return 'Cancel / Start Fresh';
      return key;
    },
  }),
}));

describe('RolloverPrompt Component', () => {
  it('renders correctly when open', () => {
    render(
      <RolloverPrompt
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        year="2025"
        prevYear="2024"
        isLoading={false}
      />
    );

    expect(screen.getByText('Rollover Fiscal Year Data')).toBeInTheDocument();
    expect(
      screen.getByText('No data found for the selected fiscal year 2025. Would you like to copy from previous year 2024?')
    ).toBeInTheDocument();
    expect(screen.getByText('Carry Forward / Copy Data')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const handleClose = vi.fn();
    render(
      <RolloverPrompt
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        year="2025"
        prevYear="2024"
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByText('Cancel / Start Fresh'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Confirm is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <RolloverPrompt
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        year="2025"
        prevYear="2024"
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByText('Carry Forward / Copy Data'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
