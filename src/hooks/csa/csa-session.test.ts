import { describe, expect, it } from 'vitest';
import {
  INITIAL_CSA_SESSION,
  csaSessionReducer,
  type CsaSessionState,
} from './csa-session';

const state = (over: Partial<CsaSessionState> = {}): CsaSessionState => ({
  ...INITIAL_CSA_SESSION,
  ...over,
});

describe('csaSessionReducer', () => {
  it('starts on an uninitialised list', () => {
    expect(INITIAL_CSA_SESSION).toEqual({
      view: 'list',
      activeCsaId: null,
      isInitialized: false,
      manualOverride: null,
    });
  });

  it('opens the form on an explicit user action and records the override', () => {
    expect(csaSessionReducer(state(), { type: 'open-form', csaId: 'csa-1' })).toEqual({
      view: 'form',
      activeCsaId: 'csa-1',
      isInitialized: true,
      manualOverride: 'form',
    });
    expect(csaSessionReducer(state(), { type: 'open-form' }).activeCsaId).toBeNull();
  });

  it('starts the form automatically without claiming the user asked for it', () => {
    const next = csaSessionReducer(state({ isInitialized: false }), { type: 'start-form', csaId: 'csa-2' });
    expect(next).toEqual({
      view: 'form',
      activeCsaId: 'csa-2',
      isInitialized: true,
      manualOverride: null,
    });
  });

  it('keeps an explicit form override when the automatic path runs again', () => {
    const current = state({ view: 'form', activeCsaId: 'csa-1', isInitialized: true, manualOverride: 'form' });
    expect(csaSessionReducer(current, { type: 'start-form' }).manualOverride).toBe('form');
  });

  it('returns to the list with the manual override set', () => {
    const current = state({ view: 'form', activeCsaId: 'csa-1', isInitialized: true, manualOverride: 'form' });
    expect(csaSessionReducer(current, { type: 'open-list' })).toEqual({
      view: 'list',
      activeCsaId: null,
      isInitialized: true,
      manualOverride: 'list',
    });
  });

  it('selects a record without changing the view', () => {
    const current = state({ view: 'form', activeCsaId: null, isInitialized: true, manualOverride: 'form' });
    expect(csaSessionReducer(current, { type: 'select', csaId: 'csa-9' })).toEqual({
      ...current,
      activeCsaId: 'csa-9',
    });
  });

  it('resets to a pristine list when the process or schedule changes', () => {
    const current = state({ view: 'form', activeCsaId: 'csa-1', isInitialized: true, manualOverride: 'form' });
    expect(csaSessionReducer(current, { type: 'reset' })).toEqual(INITIAL_CSA_SESSION);
  });
});
