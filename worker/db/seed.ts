import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getAuth } from '../auth';
import { MOCK_USERS, MOCK_DEPARTMENTS, MOCK_RCM, MOCK_CONTROLS } from '../../shared/mock-data';
import { eq, and } from 'drizzle-orm';
import crypto from 'node:crypto';

const getFriendlyEmail = (u: any): string => {
    if (u.role === 'Line 2') return 'line2@bumn.go.id';
    if (u.role === 'Line 3') return 'line3@bumn.go.id';
    if (u.role === 'CFO') return 'cfo@bumn.go.id';
    if (u.role === 'Commissioner' || u.role === 'Komisaris') return 'komisaris@bumn.go.id';
    if (u.role === 'Admin') return 'admin@bumn.go.id';
    if (u.role === 'External Auditor') return 'external@bumn.go.id';
    const deptSuffix = u.departmentId?.replace('dept-', '') || 'ops';
    const levelPrefix = u.level?.toLowerCase() || 'staff';
    return `${levelPrefix}.${deptSuffix}@bumn.go.id`.toLowerCase();
};

export const seedDatabase = async (databaseUrl: string, authSecret: string, skipLicense: string = 'false', syncOnly: boolean = false) => {
    console.log(`🌱 Seeding... Mode: ${syncOnly ? 'AUTH-SYNC' : 'FULL'}`);
    const client = neon(databaseUrl);
    const db = drizzle(client, { schema });
    
    const orgId = "org-bumn-default";

    if (!syncOnly) {
        console.log("🧹 FULL WIPE starting...");
        // Delete in order to avoid FK errors
        const tables = [
            schema.documentFslis, schema.documentGls, schema.documentDepartments,
            schema.bpmNodeRcms, schema.rcmControls, schema.auditLogs,
            schema.testRecords, schema.csaRecords, schema.deficiencies,
            schema.actionPlans, schema.aggregateDeficiencies, schema.glRows,
            schema.documents, schema.bpmDiagrams, schema.bpmProcesses,
            schema.simulations, schema.glSnapshots, schema.materiality,
            schema.member, schema.session, schema.account, schema.user,
            schema.controls, schema.rcms, schema.departments,
            schema.applications, schema.organization, schema.systemLicenses
        ];
        for (const table of tables) { await db.delete(table); }

        await db.insert(schema.organization).values({
            id: orgId, name: "PT Batubara Nusantara Sejahtera", slug: "pt-bns", entityCode: "0101", createdAt: new Date(),
        });
        for (const dept of MOCK_DEPARTMENTS) {
            await db.insert(schema.departments).values({ ...dept, organizationId: orgId });
        }
    }

    console.log("🔐 Syncing Credentials (Non-Destructive)...");
    
    // Hash password "password" (PBKDF2)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('password', salt, 100, 32, 'sha256').toString('hex');
    const passwordHash = `pbkdf2$100$${salt}$${hash}`;

    for (const u of MOCK_USERS) {
        const email = getFriendlyEmail(u);
        
        // 1. Get existing user OR create a new one (WITHOUT deleting)
        const existing = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
        let userId: string;

        if (existing.length > 0) {
            userId = existing[0].id;
            // Update profile
            await db.update(schema.user).set({
                name: u.name, role: u.role, level: u.level || "Staff", departmentId: u.departmentId, updatedAt: new Date()
            }).where(eq(schema.user.id, userId));
        } else {
            userId = crypto.randomUUID();
            await db.insert(schema.user).values({
                id: userId, email, name: u.name, emailVerified: true,
                role: u.role, level: u.level || "Staff", departmentId: u.departmentId,
                createdAt: new Date(), updatedAt: new Date()
            });
        }

        // 2. Surgical update to ACCOUNT table (Password)
        // We delete only the account row for this user, then insert a fresh one.
        // This is safe because usually nothing points to the 'account' ID itself.
        await db.delete(schema.account).where(eq(schema.account.userId, userId));
        await db.insert(schema.account).values({
            id: crypto.randomUUID(),
            userId: userId,
            accountId: email,
            providerId: 'credential',
            password: passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 3. Clear sessions
        await db.delete(schema.session).where(eq(schema.session.userId, userId));

        // 4. Ensure Organization Member
        const memberCheck = await db.select().from(schema.member)
            .where(and(eq(schema.member.userId, userId), eq(schema.member.organizationId, orgId))).limit(1);
        
        if (memberCheck.length === 0) {
            await db.insert(schema.member).values({
                id: crypto.randomUUID(), organizationId: orgId, userId: userId,
                role: u.role === 'Admin' ? 'admin' : 'member', createdAt: new Date()
            });
        }
        
        console.log(`✅ Synced: ${email}`);
    }

    if (!syncOnly) {
        console.log("📦 Filling Business Data...");
        for (const rcm of MOCK_RCM) {
            await db.insert(schema.rcms).values({
                id: rcm.id, organizationId: orgId, process: rcm.process,
                subProcess: rcm.subProcess, riskDescription: rcm.riskDescription, status: rcm.status as any,
            });
        }
        for (const ctrl of MOCK_CONTROLS) {
            await db.insert(schema.controls).values({
                id: ctrl.id, organizationId: orgId, rcmId: ctrl.rcmId,
                code: ctrl.code, name: ctrl.name, description: ctrl.description,
                ownerId: ctrl.ownerId, type: ctrl.type, nature: ctrl.nature,
                frequency: ctrl.frequency, bpmStatus: ctrl.bpmStatus || "Approved",
            });
        }
    }

    console.log("✨ ALL DONE!");
};
