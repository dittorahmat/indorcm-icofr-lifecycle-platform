import { describe, it, expect } from 'vitest';
import { WORKFLOW_BLUEPRINTS, getStatusBadgeClass, isWorkflowLocked } from './workflow-blueprints';
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

  it('derives lock from the canonical table per entity', () => {
    expect(isWorkflowLocked('BPM', 'Draft')).toBe(false);
    expect(isWorkflowLocked('BPM', 'Rejected')).toBe(false);
    expect(isWorkflowLocked('ACTION_PLAN', 'Ineffective')).toBe(false);
    expect(isWorkflowLocked('BPM', 'In Review')).toBe(true);
    expect(isWorkflowLocked('SCOPING', 'Approved')).toBe(true);
    expect(isWorkflowLocked('SCOPING', 'Rejected')).toBe(false);
    expect(isWorkflowLocked('SCOPING', 'Pending Deletion Approval')).toBe(true);
  });

  it('labels the SCOPING deletion steps instead of falling back to the action id', () => {
    expect(WORKFLOW_BLUEPRINTS.SCOPING.steps.Approved.actions.map(a => a.labelKey))
      .toEqual(['workflow:requestDeletion']);
    expect(WORKFLOW_BLUEPRINTS.SCOPING.steps['Pending Deletion Approval'].actions.map(a => a.labelKey))
      .toEqual(['workflow:rejectDeletion']);
    expect(WORKFLOW_BLUEPRINTS.SCOPING.steps['Pending Deletion Approval'].actions[0].needsNote).toBe(true);
  });

  it('maps badge classes from a single tone table', () => {
    expect(getStatusBadgeClass('Draft')).toContain('bg-slate-100');
    expect(getStatusBadgeClass('Rejected')).toContain('bg-rose-50');
    expect(getStatusBadgeClass('In Review')).toContain('bg-blue-50');
    expect(getStatusBadgeClass('In Approval')).toContain('bg-amber-50');
    expect(getStatusBadgeClass('Resolved')).toContain('bg-emerald-50');
  });
});
