import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getAuth } from '../auth';
import { MOCK_USERS, MOCK_DEPARTMENTS, MOCK_RCM, MOCK_CONTROLS } from '../../shared/mock-data';

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

export const seedDatabase = async (databaseUrl: string, authSecret: string, skipLicense: string = 'false') => {
    console.log("🌱 Re-seeding database with Real Auth (Better Auth)... Skip License:", skipLicense);
    const client = neon(databaseUrl);
    const db = drizzle(client, { schema });
    // IMPORTANT: Pass SKIP_LICENSE to ensure same hashing algorithm as production runtime
    const auth = getAuth({ DATABASE_URL: databaseUrl, BETTER_AUTH_SECRET: authSecret, SKIP_LICENSE: skipLicense });

    console.log("🧹 Cleaning up old data...");
    // Urutan penghapusan sangat penting untuk menghindari Foreign Key Constraint Error
    // 1. Tabel-tabel yang merujuk ke tabel lain (Level 3/Anak)
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
    
    // 2. Tabel-tabel level menengah (Level 2)
    await db.delete(schema.documents);
    await db.delete(schema.bpmDiagrams);
    await db.delete(schema.bpmProcesses);
    await db.delete(schema.simulations);
    await db.delete(schema.glSnapshots);
    await db.delete(schema.materiality);
    await db.delete(schema.member);
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.verification);
    
    // 3. Tabel utama (Level 1/Induk)
    await db.delete(schema.user);
    await db.delete(schema.controls);
    await db.delete(schema.rcms);
    await db.delete(schema.departments);
    await db.delete(schema.applications);
    await db.delete(schema.organization);
    await db.delete(schema.systemLicenses);

    const orgId = "org-bumn-default";
    await db.insert(schema.organization).values({
        id: orgId,
        name: "PT Batubara Nusantara Sejahtera",
        slug: "pt-bns",
        entityCode: "0101",
        createdAt: new Date(),
    });

    for (const dept of MOCK_DEPARTMENTS) {
        await db.insert(schema.departments).values({
            ...dept,
            organizationId: orgId,
        });
    }

    for (const u of MOCK_USERS) {
        const email = getFriendlyEmail(u);
        
        // Use Better Auth API to create user WITH password
        const user = await auth.api.signUpEmail({
            body: {
                email,
                password: "password",
                name: u.name,
            }
        });

        if (user) {
            // Update additional fields that signUpEmail doesn't handle natively in body
            await db.update(schema.user).set({
                role: u.role,
                level: u.level || "Staff",
                departmentId: u.departmentId,
            }).where(eq(schema.user.id, user.user.id));

            // Add to Organization
            await db.insert(schema.member).values({
                id: crypto.randomUUID(),
                organizationId: orgId,
                userId: user.user.id,
                role: u.role === 'Admin' ? 'admin' : 'member',
                createdAt: new Date(),
            });
            
            console.log(`👤 Seeded user with password: ${u.name} -> ${email}`);
        }
    }

    // 4. Insert RCMs & Controls
    for (const rcm of MOCK_RCM) {
        await db.insert(schema.rcms).values({
            id: rcm.id,
            organizationId: orgId,
            process: rcm.process,
            subProcess: rcm.subProcess,
            riskDescription: rcm.riskDescription,
            status: rcm.status as any,
        });
    }

    for (const ctrl of MOCK_CONTROLS) {
        await db.insert(schema.controls).values({
            id: ctrl.id,
            organizationId: orgId,
            rcmId: ctrl.rcmId,
            code: ctrl.code,
            name: ctrl.name,
            description: ctrl.description,
            ownerId: ctrl.ownerId,
            type: ctrl.type,
            nature: ctrl.nature,
            frequency: ctrl.frequency,
            bpmStatus: ctrl.bpmStatus || "Approved",
        });
    }

    console.log("✨ Seeding complete with Real Auth!");
};

