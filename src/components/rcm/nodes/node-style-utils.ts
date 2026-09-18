// Utility helper to calculate custom nodes width and font classes dynamically
export const getNodeStyles = (data: any, baseWidth: number = 160) => {
  const nodeScale = data?.nodeScaleOverride || 'md';
  const fontScale = data?.fontScaleOverride || 'md';

  // Calculate width override
  let nodeWidth = baseWidth;
  if (nodeScale === 'sm') nodeWidth = Math.round(baseWidth * 0.8);
  else if (nodeScale === 'lg') nodeWidth = Math.round(baseWidth * 1.25);

  // Font size styles
  let baseFontSize = 12;
  if (fontScale === 'sm') baseFontSize = 10;
  else if (fontScale === 'lg') baseFontSize = 14;

  return {
    style: {
      width: `calc(${nodeWidth}px * var(--bpm-global-width-scale, 1))`,
      fontSize: `calc(${baseFontSize}px * var(--bpm-global-font-scale, 1))`,
    },
    fontClass: ""
  };
};
