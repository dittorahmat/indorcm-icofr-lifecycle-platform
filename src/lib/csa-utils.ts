export interface FormatCsaReferenceParams {
  bpmCode?: string | null;
  noGL?: string | null;
  bpmProcessId?: string | null;
  year?: number | string | null;
  period?: string | null;
}

/**
 * Generates a standardized, auditable Reference Code for CSA assessments.
 * Formula: CSA-{RESOLVED_PREFIX}-{YEAR}-{PERIOD}
 *
 * Fallback hierarchy:
 * 1. bpmCode (e.g. "FIN-01" -> "FIN01" or "FIN-01")
 * 2. noGL (e.g. "110100" -> "GL110100")
 * 3. bpmProcessId (e.g. "proc-123456" -> "PROC-PROC-1")
 * 4. "GEN"
 */
export function formatCsaReference({
  bpmCode,
  noGL,
  bpmProcessId,
  year,
  period,
}: FormatCsaReferenceParams): string {
  let resolvedPrefix = "";
  if (bpmCode && bpmCode.trim()) {
    // Keep alphanumeric and hyphen, strip spaces
    resolvedPrefix = bpmCode.trim().replace(/\s+/g, "").replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
  } else if (noGL && noGL.trim()) {
    const cleanGL = noGL.trim().replace(/\s+/g, "").replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
    resolvedPrefix = cleanGL.startsWith("GL") ? cleanGL : `GL${cleanGL}`;
  } else if (bpmProcessId && bpmProcessId.trim()) {
    const cleanId = bpmProcessId.trim().replace(/\s+/g, "").replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
    resolvedPrefix = `PROC-${cleanId.slice(0, 6)}`;
  } else {
    resolvedPrefix = "GEN";
  }

  let resolvedYear = year ? String(year).trim() : "";
  let resolvedPeriod = period ? period.trim().toUpperCase() : "Q1";

  // Check if period already contains a 4-digit year, like "2025-Q1" or "2025/Q2"
  const yearQuarterMatch = resolvedPeriod.match(/^(\d{4})[-_/]?(Q[1-4]|ANNUAL|SEMESTER[-_]?[1-2])$/i);
  if (yearQuarterMatch) {
    if (!resolvedYear) {
      resolvedYear = yearQuarterMatch[1];
    }
    resolvedPeriod = yearQuarterMatch[2].toUpperCase();
  }

  if (!resolvedYear) {
    resolvedYear = new Date().getFullYear().toString();
  }

  return `CSA-${resolvedPrefix}-${resolvedYear}-${resolvedPeriod}`;
}
