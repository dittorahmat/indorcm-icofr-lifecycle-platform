import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { RCMExplorerToolbar } from '../RCMExplorerToolbar';

describe('RCMExplorerToolbar Mobile Responsiveness and Contrast', () => {
  it('renders active 6-mitigation pillar pill with high contrast semantic tokens and scrollable rail', () => {
    const handleSelectPillar = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <RCMExplorerToolbar
          searchTerm=""
          onSearchChange={vi.fn()}
          selectedPillar="ALL"
          onSelectPillar={handleSelectPillar}
          riskLevelFilter="ALL"
          onRiskLevelChange={vi.fn()}
          keyControlFilter="ALL"
          onKeyControlChange={vi.fn()}
          frequencyFilter="ALL"
          onFrequencyChange={vi.fn()}
          onResetFilters={vi.fn()}
        />
      </I18nextProvider>
    );

    // Active pill must have primary background with primary-foreground (WCAG AA contrast)
    const allPill = screen.getByRole('button', { name: /semua 6 pilar/i });
    expect(allPill).toHaveClass('bg-primary');
    expect(allPill).toHaveClass('text-primary-foreground');
    expect(allPill).not.toHaveClass('text-on-primary');

    // Horizontal scroll container must support touch pan and hide native scrollbars
    const rail = allPill.parentElement;
    expect(rail?.className).toContain('overflow-x-auto');
    expect(rail?.className).toContain('touch-pan-x');

    // Clicking an inactive pillar pill triggers callback
    const timingPill = screen.getByRole('button', { name: /timing accuracy/i });
    expect(timingPill).toHaveClass('bg-surface-container');
    fireEvent.click(timingPill);
    expect(handleSelectPillar).toHaveBeenCalledWith('pilarTiming');
  });
});
