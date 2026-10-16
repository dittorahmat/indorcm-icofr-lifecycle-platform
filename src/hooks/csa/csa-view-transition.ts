/** Single transition lock behind the CSA workspace view seam. */

export type CsaView = 'list' | 'form';
export type CsaViewOverride = 'list' | 'form' | null;

export interface CsaViewTransitionInput {
  scheduleId?: string | null;
  linkedRecordId?: string | null;
  initialSamplesCount: number;
  override: CsaViewOverride;
  isInitialized: boolean;
  isCheckingSchedule: boolean;
}

/** Decides whether the workspace should land on the form after init data arrives. */
export function shouldEnterForm(input: CsaViewTransitionInput): boolean {
  if (input.override === 'list') return false;
  if (input.isInitialized) return false;
  if (input.scheduleId) {
    if (input.isCheckingSchedule) return false;
    if (input.linkedRecordId) return true;
    return input.initialSamplesCount > 0;
  }
  return input.initialSamplesCount > 0;
}

/** Post-save destination: non-draft returns to list, draft stays on form. */
export function resolvePostSaveView(isDraft: boolean): CsaView {
  return isDraft ? 'form' : 'list';
}

/** Whether the list query should run (workspace list visible). */
export function shouldFetchList(view: CsaView, hasProcess: boolean): boolean {
  return hasProcess && view === 'list';
}
