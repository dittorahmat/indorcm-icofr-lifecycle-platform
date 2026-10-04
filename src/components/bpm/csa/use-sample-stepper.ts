import { useState } from 'react';

export function useSampleStepper(stepCount: number) {
  const [mobileStep, setMobileStep] = useState(0);
  const safeStep = stepCount === 0 ? 0 : Math.min(Math.max(mobileStep, 0), stepCount - 1);
  const goPrev = () => setMobileStep((s) => Math.max(s - 1, 0));
  const goNext = () => setMobileStep((s) => (stepCount === 0 ? s : Math.min(s + 1, stepCount - 1)));
  const jumpTo = (idx: number) => setMobileStep(idx);
  return { mobileStep: safeStep, setMobileStep: jumpTo, goPrev, goNext };
}
