import { bpmProcesses, notifications } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { DrizzleDb } from '../../db';

export class BpmWorkflowManager {
  constructor(private db: DrizzleDb) {}

  setDb(db: DrizzleDb) {
    this.db = db;
  }

  async handleWorkflowAction(
    orgId: string, 
    userId: string, 
    role: string, 
    id: string, 
    body: { action: any, note: string, assigneeId?: string }
  ) {
    const processes = await this.db.select().from(bpmProcesses)
      .where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)))
      .limit(1);
      
    if (processes.length === 0) throw new Error("Process not found");

    const process = processes[0];
    const currentStatus = (process.workflowStatus as any) || "Draft";
    let nextStatus = currentStatus;

    if (body.action === "Submit") {
      nextStatus = "In Review";
    } else if (body.action === "Review") {
      nextStatus = "In Approval";
    } else if (body.action === "Approve") {
      nextStatus = "Resolved";
    } else if (body.action === "Reject") {
      if (!body.note) throw new Error("Rejection requires a note");
      nextStatus = "Rejected";
    } else if (body.action === "Rollback") {
      if (!body.note) throw new Error("Rollback requires a note");
      nextStatus = "Draft";
    }

    const historyEntry = {
      id: crypto.randomUUID(),
      action: body.action,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      userId,
      role,
      timestamp: Date.now(),
      note: body.note
    };

    const currentHistory = (process.workflowHistory as any[]) || [];
    const newHistory = [historyEntry, ...currentHistory];

    await this.db.update(bpmProcesses)
      .set({ 
        workflowStatus: nextStatus,
        workflowHistory: newHistory
      })
      .where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));

    if (nextStatus !== currentStatus) {
      const targetUserId = body.assigneeId || process.createdBy || userId;
      await this.db.insert(notifications).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: targetUserId,
        message: `Status BPM "${process.name}" berubah menjadi ${nextStatus}. ${body.note ? 'Catatan: ' + body.note : ''}`,
        type: body.action === 'Reject' ? 'error' : (body.action === 'Approve' ? 'success' : 'info'),
        link: `/bpm?id=${id}`,
        readStatus: false,
        createdAt: new Date(),
      });
    }

    return { success: true, nextStatus };
  }
}
