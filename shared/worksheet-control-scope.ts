/**
 * worksheet-control-scope — one matcher for "which Control rows belong to this
 * BPM process / GL / fiscal year" (SK-5/DKU.MBU/11/2024 worksheet scoping).
 *
 * Three views ask that question: the BPM worksheet (RCM matrix), the Execution
 * Hub (BPMModal) and the CSA workspace (CSAModal). Before this module each held
 * its own copy of the filter and the CSA copy had already drifted — it had no
 * year guard and its id/name matches skipped the FSLI restriction, so controls
 * from another fiscal year or another GL reached CSA assessments that Line 2
 * later validates. One matcher, one documented match order; the only intended
 * difference between the views is the explicit `allowOrphanFallback` flag.
 *
 * Match order (a control is in scope when a step returns true):
 *   1. Year guard — a control tagged with another fiscal year never matches.
 *   2. Hard link — `bpmProcessId` equals the scope's process id.
 *   3. Name fallback — normalized `Control.subProcess` equals the scope name.
 *   4. Orphan fallback (CSA only, opt-in) — no process metadata at all, but
 *      tagged to the scope's GL.
 *
 * FSLI restriction on steps 2 and 3: when a GL is in scope and the control
 * carries FSLI tags, the control must be tagged with that GL. A control with no
 * FSLI tags passes the hard link (an explicit process link outranks a missing
 * tag) but not the name fallback (a name match alone is not proof of the GL).
 */

/** The control surface this matcher reads. Structural, so callers pass `Control[]`. */
export interface WorksheetControlLike {
  /** Fiscal year tag; untagged controls are year-agnostic. */
  year?: number | null;
  bpmProcessId?: string | null;
  subProcess?: string | null;
  fsliCodes?: string[] | null;
}

export interface WorksheetScope {
  /** Hard link: controls bound to this BPM process. */
  bpmProcessId?: string;
  /** Name fallback, normalized against `Control.subProcess`. */
  subProcessName?: string;
  /** GL (FSLI) code the worksheet is open for. */
  noGL?: string;
  /** Working fiscal year; other years are always excluded. */
  year?: string | number;
  /**
   * CSA only: also admit controls with no process metadata that are tagged to
   * `noGL`. The BPM worksheet does not show them.
   */
  allowOrphanFallback?: boolean;
}

function normalized(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().trim();
}

/**
 * FSLI restriction for an already-matched control. `untagged` is the verdict
 * when the control carries no FSLI tags: the hard process link wins (true), a
 * name-only link counts only without a GL filter (false).
 */
function passesFsliRestriction(
  control: WorksheetControlLike,
  noGL: string | undefined,
  untagged: boolean,
): boolean {
  if (!noGL) return true;
  const codes = control.fsliCodes ?? [];
  if (codes.length === 0) return untagged;
  return codes.includes(noGL);
}

function inWorksheetScope(control: WorksheetControlLike, scope: WorksheetScope): boolean {
  const { bpmProcessId, subProcessName, noGL, year, allowOrphanFallback } = scope;

  if (control.year && year && control.year.toString() !== year.toString()) return false;

  const controlSub = normalized(control.subProcess);
  const targetSub = normalized(subProcessName);

  if (bpmProcessId && control.bpmProcessId === bpmProcessId) {
    return passesFsliRestriction(control, noGL, true);
  }
  if (targetSub && controlSub === targetSub) {
    return passesFsliRestriction(control, noGL, false);
  }
  if (allowOrphanFallback && noGL && !control.bpmProcessId && !controlSub) {
    return (control.fsliCodes ?? []).includes(noGL);
  }
  return false;
}

/** Pure filter behind every worksheet view: no hooks, no I/O, no query key. */
export function filterWorksheetControls<T extends WorksheetControlLike>(
  items: readonly T[],
  scope: WorksheetScope,
): T[] {
  return items.filter((control) => inWorksheetScope(control, scope));
}
