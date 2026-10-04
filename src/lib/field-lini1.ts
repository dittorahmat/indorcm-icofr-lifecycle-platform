export function normalizeRole(role: unknown): string {
  return String(role ?? '').trim().toLowerCase();
}

/**
 * Field Lini 1 detector for the Execution Hub.
 * Safe fallback: unknown/empty role returns false so all tabs stay visible.
 * Only an explicit Line 1 role arriving from a CSA schedule gets the
 * simplified single-focus CSA experience.
 */
export function isFieldLini1(role: unknown, scheduleId?: string | null): boolean {
  if (!scheduleId) return false;
  return normalizeRole(role) === 'line 1';
}
