import { auditLogs } from '../db/schema';
import type { DrizzleDb } from '../db';

export class AuditService {
  constructor(private db: DrizzleDb) {}

  /**
   * Logs an action to the audit_logs table with automated diffing.
   */
  async logAction(params: {
    organizationId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    dataBefore?: any;
    dataAfter?: any;
    description?: string;
    isRegulatory?: boolean;
    effectiveDate?: Date;
    approvedBy?: string;
    changeCategory?: string;
  }) {
    const { 
      organizationId, userId, action, entityType, entityId, 
      dataBefore, dataAfter, isRegulatory, effectiveDate, approvedBy,
      changeCategory 
    } = params;

    let description = params.description;

    // Automated description for UPDATE if not provided
    if (!description && action === 'UPDATE' && dataBefore && dataAfter) {
      const changes = [];
      for (const key in dataAfter) {
        if (JSON.stringify(dataBefore[key]) !== JSON.stringify(dataAfter[key])) {
          changes.push(key);
        }
      }
      description = changes.length > 0 
        ? `Updated fields: ${changes.join(', ')}` 
        : `Updated ${entityType}`;
    } else if (!description) {
      description = `${action} ${entityType}`;
    }

    await this.db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      organizationId,
      userId,
      action,
      entityType,
      entityId,
      descriptionAfter: description,
      dataBefore: dataBefore ? structuredClone(dataBefore) : null,
      dataAfter: dataAfter ? structuredClone(dataAfter) : null,
      timestamp: new Date(),
      effectiveDate: effectiveDate || null,
      isRegulatory: isRegulatory || false,
      approvedBy: approvedBy || null,
      changeCategory: changeCategory || null,
    });
  }
}
