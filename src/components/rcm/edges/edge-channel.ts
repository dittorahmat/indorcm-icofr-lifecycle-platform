export interface ChannelEdge {
  id: string;
  source: string;
  target: string;
}

export const EDGE_CHANNEL_SPACING = 20;

export function channelOffsetFor(
  id: string,
  source: string,
  target: string,
  edges: readonly ChannelEdge[],
  spacing: number = EDGE_CHANNEL_SPACING,
): number {
  const parallels = edges.filter(
    (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source),
  );
  if (parallels.length < 2) return 0;
  const ranked = [...parallels].sort((a, b) => a.id.localeCompare(b.id));
  const index = ranked.findIndex((e) => e.id === id);
  if (index === -1) return 0;
  return (index - (ranked.length - 1) / 2) * spacing;
}
