import React from 'react';
import type { MaterialitySimulation } from '@shared/types';

export interface MaterialityParamsSync {
  simState: MaterialitySimulation;
  setSimState: React.Dispatch<React.SetStateAction<MaterialitySimulation>>;
}

export function useMaterialityParams(initialSimulation: MaterialitySimulation, setSimState: MaterialityParamsSync['setSimState']) {
  const [draftBasis, setDraftBasis] = React.useState(initialSimulation.basis || '');
  const [draftOmPercentage, setDraftOmPercentage] = React.useState(initialSimulation.omPercentage || 0);
  const [draftHaircutPercentage, setDraftHaircutPercentage] = React.useState(initialSimulation.haircutPercentage || 0);

  const [activeBasis, setActiveBasis] = React.useState(initialSimulation.basis || '');
  const [activeOmPercentage, setActiveOmPercentage] = React.useState(initialSimulation.omPercentage || 0);
  const [activeHaircutPercentage, setActiveHaircutPercentage] = React.useState(initialSimulation.haircutPercentage || 0);

  const [isRecalculating, setIsRecalculating] = React.useState(false);

  const isStale = React.useMemo(() => {
    return draftBasis !== activeBasis || draftOmPercentage !== activeOmPercentage || draftHaircutPercentage !== activeHaircutPercentage;
  }, [draftBasis, activeBasis, draftOmPercentage, activeOmPercentage, draftHaircutPercentage, activeHaircutPercentage]);

  const syncTo = React.useCallback(
    (sim: MaterialitySimulation) => {
      setDraftBasis(sim.basis || '');
      setDraftOmPercentage(sim.omPercentage || 0);
      setDraftHaircutPercentage(sim.haircutPercentage || 0);
      setActiveBasis(sim.basis || '');
      setActiveOmPercentage(sim.omPercentage || 0);
      setActiveHaircutPercentage(sim.haircutPercentage || 0);
    },
    [],
  );

  const applyDraft = React.useCallback((basis: string, om: number, haircut: number) => {
    setActiveBasis(basis);
    setActiveOmPercentage(om);
    setActiveHaircutPercentage(haircut);
    setSimState((prev) => ({ ...prev, basis, omPercentage: om, haircutPercentage: haircut }));
  }, [setSimState]);

  const handleRecalculate = React.useCallback(
    (om?: number, haircut?: number) => {
      setIsRecalculating(true);
      const targetOm = om !== undefined ? om : draftOmPercentage;
      const targetHaircut = haircut !== undefined ? haircut : draftHaircutPercentage;

      setDraftOmPercentage(targetOm);
      setDraftHaircutPercentage(targetHaircut);

      setTimeout(() => {
        setActiveBasis(draftBasis);
        setActiveOmPercentage(targetOm);
        setActiveHaircutPercentage(targetHaircut);
        setSimState((prev) => ({ ...prev, basis: draftBasis, omPercentage: targetOm, haircutPercentage: targetHaircut }));
        setIsRecalculating(false);
      }, 500);
    },
    [draftBasis, draftOmPercentage, draftHaircutPercentage, setSimState],
  );

  return {
    draftBasis, setDraftBasis,
    draftOmPercentage, setDraftOmPercentage,
    draftHaircutPercentage, setDraftHaircutPercentage,
    activeBasis, setActiveBasis,
    activeOmPercentage, setActiveOmPercentage,
    activeHaircutPercentage, setActiveHaircutPercentage,
    isStale,
    isRecalculating,
    syncTo,
    applyDraft,
    handleRecalculate,
  };
}
