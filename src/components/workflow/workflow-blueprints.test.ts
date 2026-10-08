import { describe, it, expect } from 'vitest';
import { WORKFLOW_BLUEPRINTS } from './workflow-blueprints';
import {
  allowedActionsFor,
  requiresNoteFor,
  WORKFLOW_TRANSITION_RULES,
  type WorkflowEntityType,
} from '@shared/workflow-transitions';

const ENTITIES = Object.keys(WORKFLOW_TRANSITION_RULES) as WorkflowEntityType[];

/** No-drift lock: client blueprints mirror the canonical server table exactly. */
describe('workflow blueprints derive from single source', () => {
  it('covers every canonical status for all five entities', () => {
    for (const entity of ENTITIES) {
      expect(Object.keys(WORKFLOW_BLUEPRINTS[entity].steps).sort()).toEqual(
        Object.keys(WORKFLOW_TRANSITION_RULES[entity]).sort(),
      );
    }
  });

  it('exposes exactly the canonical actions with canonical note requirements', () => {
    for (const entity of ENTITIES) {
      for (const status of Object.keys(WORKFLOW_TRANSITION_RULES[entity])) {
        const actions = WORKFLOW_BLUEPRINTS[entity].steps[status].actions;
        expect(actions.map((a) => a.id)).toEqual(allowedActionsFor(entity, status));
        for (const action of actions) {
          expect(action.needsNote).toBe(requiresNoteFor(entity, status, action.id));
        }
      }
    }
  });

  it('returns empty actions for unknown status (no crash on drifted data)', () => {
    for (const entity of ENTITIES) {
      expect(WORKFLOW_BLUEPRINTS[entity].steps['NoSuchStatus']).toBeUndefined();
    }
  });
});
