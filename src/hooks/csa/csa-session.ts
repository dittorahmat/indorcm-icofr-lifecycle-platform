/**
 * CSA hub view session. One reducer owns the question "list or form?",
 * replacing five state atoms (`view`, `activeCsaId`, `isInitialized`, a
 * `manualViewOverride` ref) and five effects that used to reverse each other.
 *
 * `manualOverride` is load-bearing: an explicit user navigation wins over the
 * automatic entry rules in `csa-view-transition.ts`.
 */
export type CsaView = 'list' | 'form';
export type CsaManualOverride = 'list' | 'form' | null;

export interface CsaSessionState {
  view: CsaView;
  activeCsaId: string | null;
  isInitialized: boolean;
  manualOverride: CsaManualOverride;
}

export const INITIAL_CSA_SESSION: CsaSessionState = {
  view: 'list',
  activeCsaId: null,
  isInitialized: false,
  manualOverride: null,
};

export type CsaSessionEvent =
  /** Process/schedule changed: back to a pristine list. */
  | { type: 'reset' }
  /** User asked for the form (detail, new assessment, capture). */
  | { type: 'open-form'; csaId?: string | null }
  /** The entry rules picked the form for the user (linked schedule or samples). */
  | { type: 'start-form'; csaId?: string | null }
  | { type: 'open-list' }
  | { type: 'select'; csaId: string | null };

export function csaSessionReducer(state: CsaSessionState, event: CsaSessionEvent): CsaSessionState {
  switch (event.type) {
    case 'reset':
      return INITIAL_CSA_SESSION;
    case 'open-form':
      return {
        view: 'form',
        activeCsaId: event.csaId ?? null,
        isInitialized: true,
        manualOverride: 'form',
      };
    case 'start-form':
      return {
        ...state,
        view: 'form',
        activeCsaId: event.csaId ?? null,
        isInitialized: true,
      };
    case 'open-list':
      return { view: 'list', activeCsaId: null, isInitialized: true, manualOverride: 'list' };
    case 'select':
      return { ...state, activeCsaId: event.csaId };
  }
}
