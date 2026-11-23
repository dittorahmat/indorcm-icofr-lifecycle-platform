/**
 * Pure helper utilities for BPM step references (Ref_Langkah_BPM / stepRef).
 * Used across BPM diagram extraction, editor selection, and RCM ingestion matching.
 */

const STEP_REF_REGEX = /^(?:\[([A-Za-z0-9_.-]+)\]|\(([A-Za-z0-9_.-]+)\)|([0-9]+(?:\.[0-9]+)+|[A-Za-z]+-[0-9]+))(?:\s*[:.-]?\s*|$)/;

export function extractStepRefFromLabel(label?: string | null): string | undefined {
  if (!label) return undefined;
  const trimmed = label.trim();
  const match = trimmed.match(STEP_REF_REGEX);
  if (!match) return undefined;
  return match[1] || match[2] || match[3];
}

export function matchesStepRef(
  nodeStepRef: string | undefined,
  nodeLabel: string | undefined,
  targetRef: string | undefined
): boolean {
  if (!targetRef) return false;
  const cleanTarget = targetRef.trim().toLowerCase();
  if (nodeStepRef && nodeStepRef.trim().toLowerCase() === cleanTarget) {
    return true;
  }
  if (nodeLabel) {
    const cleanLabel = nodeLabel.trim().toLowerCase();
    return (
      cleanLabel.startsWith(cleanTarget) ||
      cleanLabel.includes(`[${cleanTarget}]`) ||
      cleanLabel.includes(`(${cleanTarget})`)
    );
  }
  return false;
}

/**
 * Format standard composite BPM node label: "[stepRef] stepName" or fallback to default label.
 */
export function formatBpmNodeLabel(
  stepRef?: string,
  stepName?: string,
  fallbackLabel: string = 'Aktivitas Baru'
): string {
  const cleanRef = stepRef?.trim();
  const cleanName = stepName?.trim();
  if (cleanRef && cleanName) {
    return `${cleanRef} ${cleanName}`;
  }
  if (cleanName) {
    return cleanName;
  }
  if (cleanRef) {
    return `${cleanRef} ${fallbackLabel}`;
  }
  return fallbackLabel;
}
