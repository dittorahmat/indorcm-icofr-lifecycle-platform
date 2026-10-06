import * as React from 'react';
import {
  calculateOM,
  calculatePM,
  getGroupMultiplier,
} from '@/pages/scoping/services/materiality-calc';
import { aggregateFsliCandidates } from './aggregate-fsli';
import type { ParsedTbRow } from './smart-import-types';

export function useSmartImportMateriality(parsedTbData: ParsedTbRow[]) {
  const [selectedBasis, setSelectedBasis] = React.useState<string>('');
  const [benchmarkPopoverOpen, setBenchmarkPopoverOpen] = React.useState(false);
  const [omPercentage, setOmPercentage] = React.useState<number>(5);
  const [haircutPercentage, setHaircutPercentage] = React.useState<number>(25);
  const [locationCount, setLocationCount] = React.useState<number>(1);

  const uniqueFsliData = React.useMemo(() => aggregateFsliCandidates(parsedTbData), [parsedTbData]);

  React.useEffect(() => {
    if (uniqueFsliData.length > 0 && !selectedBasis) {
      const first = uniqueFsliData[0];
      if (first) setSelectedBasis(first.name);
    }
  }, [uniqueFsliData, selectedBasis]);

  const benchmarkTotal = uniqueFsliData.find((f) => f.name === selectedBasis)?.total || 0;
  const groupMultiplier = getGroupMultiplier(locationCount);
  const omValue = calculateOM(benchmarkTotal, omPercentage, groupMultiplier);
  const pmValue = calculatePM(omValue, haircutPercentage);

  return {
    selectedBasis,
    benchmarkPopoverOpen,
    omPercentage,
    haircutPercentage,
    locationCount,
    uniqueFsliData,
    benchmarkTotal,
    groupMultiplier,
    omValue,
    pmValue,
    setSelectedBasis,
    setBenchmarkPopoverOpen,
    setOmPercentage,
    setHaircutPercentage,
    setLocationCount,
  };
}
