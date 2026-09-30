import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { CSARealizationTable } from '../CSARealizationTable';
import { Control } from '@shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

describe('CSARealizationTable mobile responsive view', () => {
  const mockControls: Partial<Control>[] = [
    {
      id: 'ctrl-1',
      code: 'CTRL-01',
      name: 'Sample Control 1',
      frequency: 'Annual',
      lastCsaDate: 1772323200000,
    },
    {
      id: 'ctrl-2',
      code: 'CTRL-02',
      name: 'Sample Control 2',
      frequency: 'Annual',
      lastCsaDate: null,
    },
    {
      id: 'ctrl-3',
      code: 'CTRL-03',
      name: 'Sample Control 3',
      frequency: 'Monthly',
      lastCsaDate: 1772323200000,
    },
  ];

  it('renders both desktop table and mobile stacked card representations', () => {
    const { container } = render(
      <CSARealizationTable controls={mockControls as Control[]} />
    );

    // Verify mobile container exists
    const mobileContainer = container.querySelector('.md\\:hidden');
    expect(mobileContainer).not.toBeNull();

    // Verify desktop container exists
    const desktopContainer = container.querySelector('.hidden.md\\:block');
    expect(desktopContainer).not.toBeNull();
  });
});
