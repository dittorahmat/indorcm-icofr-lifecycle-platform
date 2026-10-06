export const initialNodes = [
  { id: '1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start', type: 'start' } },
];

// Badge helper nodes never take part in select-vs-edit: neither single-click
// selection nor double-click worksheet opening applies to them.
const NON_SELECTABLE_BADGE_TYPES = new Set(['risk-control-badge', 'docked-risk', 'docked-control']);

export function isBadgeNodeType(type?: string | null) {
  return !!type && NON_SELECTABLE_BADGE_TYPES.has(type);
}
