import type { DeficiencyWorkflowStatus } from '@shared/types';

/**
 * Pure SK-5 transition resolver for the Deficiency Board Kanban
 * drag-and-drop (Ineffective -> In Review -> In Approval -> Resolved,
 * any -> Ineffective). Kept free of React/DnD so the governance matrix is
 * unit-testable. Returns `{ action, note }` for legal moves or `{ error }`
 * carrying the user-facing rejection message (`same-status` is silent).
 */
export type WorkflowDragResolution =
  | { action: string; note: string }
  | { error: string };

export function resolveWorkflowAction(
  current: DeficiencyWorkflowStatus,
  target: DeficiencyWorkflowStatus,
  role: string
): WorkflowDragResolution {
  if (current === target) return { error: 'same-status' };

  if (current === 'Ineffective' && target === 'In Review') {
    if (!['Line 1', 'Admin'].includes(role)) {
      return { error: "Hanya Lini 1 atau Admin yang dapat mengajukan rencana aksi (Submit)." };
    }
    return { action: "Submit", note: `Transitioned via Kanban board drag-and-drop to ${target}` };
  }
  if (current === 'In Review' && target === 'In Approval') {
    if (!['Line 2', 'Admin'].includes(role)) {
      return { error: "Hanya Lini 2 atau Admin yang dapat meloloskan telaah (Pass Review)." };
    }
    return { action: "Review", note: `Transitioned via Kanban board drag-and-drop to ${target}` };
  }
  if (current === 'In Approval' && target === 'Resolved') {
    if (!['Admin'].includes(role)) {
      return { error: "Hanya Admin yang dapat menyetujui penyelesaian (Approve)." };
    }
    return { action: "Approve", note: `Transitioned via Kanban board drag-and-drop to ${target}` };
  }
  if (target === 'Ineffective') {
    return {
      action: current === 'Resolved' ? 'Rollback' : 'Reject',
      note: `Dikembalikan ke status Ineffective via Kanban board`,
    };
  }
  // Direct jump authorized for Admin only.
  if (role === 'Admin') {
    if (target === 'Resolved') return { action: 'Approve', note: `Transitioned via Kanban board drag-and-drop to ${target}` };
    if (target === 'In Approval') return { action: 'Review', note: `Transitioned via Kanban board drag-and-drop to ${target}` };
    if (target === 'In Review') return { action: 'Submit', note: `Transitioned via Kanban board drag-and-drop to ${target}` };
  }
  return { error: `Perpindahan status dari "${current}" ke "${target}" tidak diizinkan tanpa tahapan tata kelola SK-5.` };
}
