import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MaterialityParamsCard } from './MaterialityParamsCard';
import { createMockMaterialitySimulation } from '@/test/fixtures/scoping-simulation';
import { strictT } from '@/test/mock-i18n';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: strictT,
    i18n: { language: 'id' },
  }),
}));

describe('MaterialityParamsCard Component', () => {
  const mockSim = createMockMaterialitySimulation({
    id: 'sim-1',
    name: 'Baseline 2026',
    omPercentage: 5,
    haircutPercentage: 25,
    materialityJustification: {
      justificationText: 'Justifikasi sudah lengkap.'
    },
  });

  it('renders inputs and triggers recalculate with updated parameters', () => {
    const handleRecalculate = vi.fn();
    const setDraftOmPercentage = vi.fn();
    const setDraftHaircutPercentage = vi.fn();
    const setSimState = vi.fn();

    render(
      <MaterialityParamsCard
        simState={mockSim}
        setSimState={setSimState}
        multiplier={1}
        benchmarkValue={100000000}
        isLocked={false}
        draftOmPercentage={5}
        setDraftOmPercentage={setDraftOmPercentage}
        draftHaircutPercentage={25}
        setDraftHaircutPercentage={setDraftHaircutPercentage}
        isRecalculating={false}
        handleRecalculate={handleRecalculate}
      />
    );

    // Verify significant locations input
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();

    // Verify OM and Haircut inputs
    const omInput = screen.getByDisplayValue('5');
    const haircutInput = screen.getByDisplayValue('25');
    expect(omInput).toBeInTheDocument();
    expect(haircutInput).toBeInTheDocument();

    // Change OM percentage
    fireEvent.change(omInput, { target: { value: '6' } });

    // Warning banner appears and recalculate button becomes active
    expect(screen.getByText('params.staleWarning')).toBeInTheDocument();

    const recalcBtn = screen.getByRole('button', { name: /params\.recalculate/i });
    expect(recalcBtn).not.toBeDisabled();

    fireEvent.click(recalcBtn);

    expect(setDraftOmPercentage).toHaveBeenCalledWith(6);
    expect(setDraftHaircutPercentage).toHaveBeenCalledWith(25);
    expect(handleRecalculate).toHaveBeenCalledWith(6, 25);
  });
});
