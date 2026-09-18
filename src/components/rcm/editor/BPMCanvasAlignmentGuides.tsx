import React from 'react';

interface BPMCanvasAlignmentGuidesProps {
  horizontal?: number;
  vertical?: number;
}

export const BPMCanvasAlignmentGuides: React.FC<BPMCanvasAlignmentGuidesProps> = ({
  horizontal,
  vertical,
}) => {
  if (horizontal === undefined && vertical === undefined) {
    return null;
  }

  return (
    <svg className="pointer-events-none absolute inset-0 z-50 h-full w-full overflow-visible">
      {horizontal !== undefined && (
        <line
          x1="-10000"
          x2="10000"
          y1={horizontal}
          y2={horizontal}
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      )}
      {vertical !== undefined && (
        <line
          x1={vertical}
          x2={vertical}
          y1="-10000"
          y2="10000"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
};
