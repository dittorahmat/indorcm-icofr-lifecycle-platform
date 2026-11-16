/**
 * Helper to build canonical BPM deep-link URL with search parameters
 */
export function buildBpmDeepLinkUrl(diagramId?: string | null, nodeId?: string | null): string {
  const params = new URLSearchParams();
  if (diagramId) {
    params.set('diagramId', diagramId);
  }
  if (nodeId) {
    params.set('nodeId', nodeId);
  }
  const queryString = params.toString();
  return queryString ? `/bpm?${queryString}` : '/bpm';
}

/**
 * Truncate long node/step labels for compact badges
 */
export function formatBpmStepLabel(nodeId?: string | null, fallback = 'BPM', maxLength = 14): string {
  if (!nodeId) return fallback;
  return nodeId.length > maxLength ? 'BPM Step' : nodeId;
}
