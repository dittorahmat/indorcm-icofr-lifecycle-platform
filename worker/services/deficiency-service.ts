import { DrizzleDb } from '../db';
import { deficiencies, actionPlans, controls } from '../db/schema';
import { and, eq, sql } from 'drizzle-orm';

export class DeficiencyService {
  constructor(private db: DrizzleDb) {}

  async createAutoDeficiency({
    organizationId,
    controlId,
    description,
    source,
    userId,
    period
  }: {
    organizationId: string;
    controlId: string | null;
    description: string;
    source: string;
    userId: string;
    period: string;
  }) {
    // 1. Check for existing open deficiency for this control/period to avoid duplicates
    // If controlId is provided, scope by (organizationId, controlId, period).
    // If controlId is null, scope by (organizationId, null controlId, period, and description prefix).
    const conditions = [
      eq(deficiencies.organizationId, organizationId),
      eq(deficiencies.status, 'Open')
    ];

    if (controlId) {
      conditions.push(eq(deficiencies.controlId, controlId));
      conditions.push(sql`description LIKE ${`%${period}%`}`);
    } else {
      conditions.push(sql`${deficiencies.controlId} IS NULL`);
      // Extract prefix before '(' to match the specific BPM process
      const processPrefix = description.includes('(') ? description.split('(')[0].trim() : description;
      conditions.push(sql`description LIKE ${`%${processPrefix}%`}`);
      conditions.push(sql`description LIKE ${`%${period}%`}`);
    }

    const existing = await this.db.select().from(deficiencies).where(and(...conditions)).limit(1);

    if (existing.length > 0) return existing[0].id;

    const deficiencyId = crypto.randomUUID();

    // Fetch control metadata if controlId is provided
    let controlPrefix = "";
    if (controlId) {
      const ctrl = await this.db.query.controls.findFirst({
        where: eq(controls.id, controlId),
        columns: { code: true, name: true }
      });
      if (ctrl) {
        controlPrefix = `[${ctrl.code} - ${ctrl.name}] `;
      }
    }

    const finalDescription = controlPrefix && !description.startsWith('[') ? `${controlPrefix}${description}` : description;

    // 2. Create Deficiency
    await this.db.insert(deficiencies).values({
      id: deficiencyId,
      organizationId,
      controlId,
      description: finalDescription,
      severity: 'Control Deficiency',
      identifiedDate: new Date(),
      identifiedBy: userId,
      status: 'Open',
      source: source as any
    });

    // 3. Create initial Action Plan
    const currentYear = new Date().getFullYear();
    const defaultYearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    await this.db.insert(actionPlans).values({
      id: crypto.randomUUID(),
      organizationId,
      deficiencyId,
      description: `Rencana tindak lanjut atas temuan ${source} (${period})`,
      status: 'Draft',
      workflowStatus: 'Ineffective',
      ownerId: userId,
      dueDate: defaultYearEnd,
      targetDate: defaultYearEnd,
      createdAt: new Date(),
    } as any);

    return deficiencyId;
  }
}
