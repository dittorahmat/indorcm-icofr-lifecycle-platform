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
    return `${levelPrefix}.${deptSuffix}@bumn.go.id`;
};

export const seedDatabase = async (databaseUrl: string, authSecret: string, skipLicense: string = 'false', syncOnly: boolean = false) => {
    console.log(`🌱 Seeding database. Mode: ${syncOnly ? 'AUTH-SYNC' : 'FULL'}. Skip License: ${skipLicense}`);
    const client = neon(databaseUrl);
    const db = drizzle(client, { schema });
    
    if (!syncOnly) {
        console.log("🧹 Cleaning up all data (FULL WIPE)...");
        await db.delete(schema.documentFslis);
        await db.delete(schema.documentGls);
        await db.delete(schema.documentDepartments);
        await db.delete(schema.bpmNodeRcms);
        await db.delete(schema.rcmControls);
        await db.delete(schema.auditLogs);
        await db.delete(schema.testRecords);
        await db.delete(schema.csaRecords);
        await db.delete(schema.deficiencies);
        await db.delete(schema.actionPlans);
        await db.delete(schema.aggregateDeficiencies);
        await db.delete(schema.glRows);
        await db.delete(schema.documents);
        await db.delete(schema.bpmDiagrams);
        await db.delete(schema.bpmProcesses);
        await db.delete(schema.simulations);
        await db.delete(schema.glSnapshots);
        await db.delete(schema.materiality);
        await db.delete(schema.member);
        await db.delete(schema.session);
        await db.delete(schema.account);
        await db.delete(schema.user);
        await db.delete(schema.controls);
        await db.delete(schema.rcms);
        await db.delete(schema.departments);
        await db.delete(schema.applications);
        await db.delete(schema.organization);
        await db.delete(schema.systemLicenses);

        console.log("🏗️ Creating organization...");
        await db.insert(schema.organization).values({
            id: "org-bumn-default",
            name: "PT Batubara Nusantara Sejahtera",
            slug: "pt-bns",
            entityCode: "0101",
            createdAt: new Date(),
        });

        for (const dept of MOCK_DEPARTMENTS) {
            await db.insert(schema.departments).values({ ...dept, organizationId: "org-bumn-default" });
        }
    }

    console.log("🔐 Synchronizing Demo Users...");
    
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('password', salt, 100, 32, 'sha256').toString('hex');
    const passwordHash = `pbkdf2$100$${salt}$${hash}`;

    for (const u of MOCK_USERS) {
        const email = getFriendlyEmail(u).toLowerCase();
        
        // 1. Get or Create User
        const existing = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
        let userId: string;

        if (existing.length === 0) {
            userId = crypto.randomUUID();
            await db.insert(schema.user).values({
                id: userId, email, name: u.name, emailVerified: true,
                role: u.role, level: u.level || "Staff", departmentId: u.departmentId,
                createdAt: new Date(), updatedAt: new Date(),
            });
        } else {
            userId = existing[0].id;
            await db.update(schema.user).set({
                name: u.name, role: u.role, level: u.level || "Staff", departmentId: u.departmentId,
                updatedAt: new Date(),
            }).where(eq(schema.user.id, userId));
        }

        // 2. FORCE RE-CREATE ACCOUNT (To ensure Better Auth sees it)
        // IMPORTANT: providerId MUST be 'credential' for email/password login in Better Auth
        await db.delete(schema.account).where(eq(schema.account.userId, userId));
        await db.insert(schema.account).values({
            id: crypto.randomUUID(),
            userId: userId,
            accountId: email, // This is usually the email for credential provider
            providerId: 'credential', 
            password: passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 3. Clear sessions
        await db.delete(schema.session).where(eq(schema.session.userId, userId));

        // 4. Ensure Organization Member
        const existingMember = await db.select().from(schema.member)
            .where(and(eq(schema.member.userId, userId), eq(schema.member.organizationId, "org-bumn-default"))).limit(1);
        
        if (existingMember.length === 0) {
            await db.insert(schema.member).values({
                id: crypto.randomUUID(),
                organizationId: "org-bumn-default",
                userId: userId,
                role: u.role === 'Admin' ? 'admin' : 'member',
                createdAt: new Date(),
            });
        }
        
        console.log(`✅ Synced: ${email}`);
    }

    if (!syncOnly) {
        console.log("📦 Filling Business Data...");
        for (const rcm of MOCK_RCM) {
            await db.insert(schema.rcms).values({
                id: rcm.id, organizationId: "org-bumn-default", process: rcm.process,
                subProcess: rcm.subProcess, riskDescription: rcm.riskDescription, status: rcm.status as any,
            });
        }
        for (const ctrl of MOCK_CONTROLS) {
            await db.insert(schema.controls).values({
                id: ctrl.id, organizationId: "org-bumn-default", rcmId: ctrl.rcmId,
                code: ctrl.code, name: ctrl.name, description: ctrl.description,
                ownerId: ctrl.ownerId, type: ctrl.type, nature: ctrl.nature,
                frequency: ctrl.frequency, bpmStatus: ctrl.bpmStatus || "Approved",
            });
        }
    }

    console.log("✨ ALL DONE!");
};
