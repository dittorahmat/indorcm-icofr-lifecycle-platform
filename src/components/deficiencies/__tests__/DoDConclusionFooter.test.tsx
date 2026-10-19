import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DoDConclusionFooter } from '../DoDConclusionFooter';
import { SEVERITY_PANEL_CLASS } from '@/lib/badge-tone';
import { strictT } from '@/test/mock-i18n';

/**
 * The conclusion footer was one of the copies: its own panel classes, the raw
 * English severity string as the headline, and two hardcoded Indonesian
 * sentences. `strictT` validates every key against the real `en` bundle and
 * returns the key, so a missing bundle entry fails here rather than rendering a
 * raw key in production.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: strictT }),
}));

const renderFooter = (computedSeverity: 'Material Weakness' | 'Significant Deficiency' | 'Control Deficiency') =>
  render(
    <DoDConclusionFooter
      computedSeverity={computedSeverity}
      governanceRouting={['Komite Audit']}
      isSubmittable
      onSave={vi.fn()}
      onCancel={vi.fn()}
    />,
  );

describe('DoDConclusionFooter severity panel', () => {
  it('labels the severity and its routing consequence from bundle keys', () => {
    renderFooter('Material Weakness');
    expect(screen.getByText('dodReport.summary.materialWeakness')).toBeInTheDocument();
    expect(screen.getByText('worksheet.conclusion.impact.mw')).toBeInTheDocument();
  });

  it('switches the label and the consequence with the severity', () => {
    renderFooter('Significant Deficiency');
    expect(screen.getByText('dodReport.summary.significantDeficiency')).toBeInTheDocument();
    expect(screen.getByText('worksheet.conclusion.impact.sd')).toBeInTheDocument();
  });

  it('paints the panel with the tone the owner assigns instead of a local copy', () => {
    const { container } = renderFooter('Control Deficiency');
    const panel = container.querySelector('[class*="bg-blue-50"]');
    expect(panel?.className).toContain(SEVERITY_PANEL_CLASS.cd);
  });
});
