import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getAuth } from '../auth';
import { MOCK_USERS, MOCK_DEPARTMENTS, MOCK_RCM, MOCK_CONTROLS } from '../../shared/mock-data';
import { eq, and, sql } from 'drizzle-orm';
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
    console.log(`🌱 Seeding... Mode: NON-DESTRUCTIVE UPSERT`);
    const client = neon(databaseUrl);
    const db = drizzle(client, { schema });
    
    const orgId = "org-bumn-default";

    // 1. ENSURE ORGANIZATION
    await db.insert(schema.organization).values({
        id: orgId, name: "PT Batubara Nusantara Sejahtera", slug: "pt-bns", entityCode: "0101", createdAt: new Date(),
    }).onConflictDoNothing();

    // 2. SYNC DEPARTMENTS
    console.log("🏢 Syncing Departments...");
    for (const dept of MOCK_DEPARTMENTS) {
        await db.insert(schema.departments).values({ ...dept, organizationId: orgId })
            .onConflictDoUpdate({
                target: schema.departments.id,
                set: { name: dept.name }
            });
    }

    // 3. SYNC USERS & ACCOUNTS
    console.log("🔐 Syncing Credentials...");
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 600000;
    const hash = crypto.pbkdf2Sync('password', salt, iterations, 32, 'sha256').toString('hex');
    const passwordHash = `pbkdf2$${iterations}$${salt}$${hash}`;

    for (const u of MOCK_USERS) {
        const email = getFriendlyEmail(u);
        const existing = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
        let userId: string;

        if (existing.length > 0) {
            userId = existing[0].id;
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

        // Account (Password)
        await db.insert(schema.account).values({
            id: crypto.randomUUID(), userId: userId, accountId: email, providerId: 'credential',
            password: passwordHash, createdAt: new Date(), updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: [schema.account.providerId, schema.account.accountId],
            set: { password: passwordHash, updatedAt: new Date() }
        });

        // Org Membership
        await db.insert(schema.member).values({
            id: crypto.randomUUID(), organizationId: orgId, userId: userId,
            role: u.role === 'Admin' ? 'admin' : 'member', createdAt: new Date()
        }).onConflictDoNothing();
    }

    if (!syncOnly) {
        console.log("📦 Syncing Master Business Data (Non-Destructive)...");
        
        // RCM
        for (const rcm of MOCK_RCM) {
            await db.insert(schema.rcms).values({
                id: rcm.id, organizationId: orgId, process: rcm.process,
                subProcess: rcm.subProcess, riskDescription: rcm.riskDescription, status: rcm.status as any,
            }).onConflictDoUpdate({
                target: schema.rcms.id,
                set: { process: rcm.process, subProcess: rcm.subProcess, riskDescription: rcm.riskDescription }
            });
        }

        // CONTROLS (This will apply the new fsliCodes without deleting existing records)
        for (const ctrl of MOCK_CONTROLS) {
            await db.insert(schema.controls).values({
                id: ctrl.id, organizationId: orgId, rcmId: ctrl.rcmId,
                code: ctrl.code, name: ctrl.name, description: ctrl.description,
                ownerId: ctrl.ownerId, type: ctrl.type, nature: ctrl.nature,
                frequency: ctrl.frequency, bpmStatus: ctrl.bpmStatus || "Approved",
                fsliCodes: ctrl.fsliCodes || []
            }).onConflictDoUpdate({
                target: schema.controls.id,
                set: { 
                    code: ctrl.code, 
                    name: ctrl.name, 
                    description: ctrl.description,
                    fsliCodes: ctrl.fsliCodes || [],
                    nature: ctrl.nature,
                    frequency: ctrl.frequency
                }
            });
        }
    }

    console.log("✨ ALL DONE! No data was deleted.");
};
