import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { strictT } from '@/test/mock-i18n';
import { SignificantApplicationInventory } from '../components/SignificantApplicationInventory';
import { SocRepository } from '../components/SocRepository';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: strictT }) }));

const noop = () => {};

describe('SOCMonitoring list shells', () => {
  it('renders the loading copy in both views of the application inventory', () => {
    render(
      <SignificantApplicationInventory
        applications={[]}
        isLoading
        onView={noop}
        onEdit={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getAllByText('Loading...')).toHaveLength(2);
  });

  it('renders the empty copy in both views of the application inventory', () => {
    render(
      <SignificantApplicationInventory
        applications={[]}
        isLoading={false}
        onView={noop}
        onEdit={noop}
        onDelete={noop}
      />,
    );
    expect(
      screen.getAllByText('No applications found. Click "Add Application" to start.'),
    ).toHaveLength(2);
  });

  it('renders the loading and empty copy for the SOC repository', () => {
    const { unmount } = render(<SocRepository reports={[]} isLoading onReview={noop} />);
    expect(screen.getAllByText('Loading SOC data...')).toHaveLength(2);
    unmount();

    render(<SocRepository reports={[]} isLoading={false} onReview={noop} />);
    expect(
      screen.getAllByText('No SOC reports found. Register a vendor and report to begin.'),
    ).toHaveLength(2);
  });
});
