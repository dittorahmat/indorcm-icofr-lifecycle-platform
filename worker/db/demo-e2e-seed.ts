import * as schema from './schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

export const seedE2EDemoScenarios = async (db: NeonHttpDatabase<typeof schema>, orgId: string) => {
    console.log("🚀 Seeding E2E Demo Scenarios (PT BNS - 2026)...");

    const year = 2026;
    const now = new Date();

    // 1. GL SNAPSHOT & ROWS (FSLI Coal Accounts)
    const snapshotId = `gl-snapshot-${orgId}-${year}`;
    await db.insert(schema.glSnapshots).values({
        id: snapshotId,
        organizationId: orgId,
        filename: "Laporan_Keuangan_Audit_2026_PT_BNS.xlsx",
        uploadDate: now,
        status: "Mapped",
        isActive: true,
        year,
        benchmarkFsliNames: ["Pendapatan Usaha Penjualan Batubara", "Beban Pokok Pendapatan"]
    }).onConflictDoNothing();

    const glAccounts = [
        { noGL: '40001-REV-COAL', desc: 'Pendapatan Usaha Penjualan Batubara Ekspor & PLN', fsliCode: '10008-000318', fsliName: 'Pendapatan Usaha', balance: 500000000000, cat: 'Revenue' },
        { noGL: '10001-CASH', desc: 'Kas dan Setara Kas - Bank Mandiri & BRI', fsliCode: '10001-000100', fsliName: 'Kas dan Bank', balance: 85000000000, cat: 'Asset' },
        { noGL: '11001-AR-COAL', desc: 'Piutang Usaha Penjualan Batubara PT PLN (Persero)', fsliCode: '10002-000200', fsliName: 'Piutang Usaha', balance: 120000000000, cat: 'Asset' },
        { noGL: '50001-COGS-MINING', desc: 'Beban Jasa Penambangan & Hauling Kontraktor', fsliCode: '20001-000500', fsliName: 'Beban Pokok Penjualan', balance: 320000000000, cat: 'Expense' },
    ];

    for (let i = 0; i < glAccounts.length; i++) {
        const acc = glAccounts[i];
        await db.insert(schema.glRows).values({
            id: `gl-row-${orgId}-${year}-${acc.noGL}`,
            snapshotId,
            organizationId: orgId,
            ymd: '20261231',
            entityCode: '0101',
            noGL: acc.noGL,
            glDesc: acc.desc,
            currency: 'IDR',
            balance: acc.balance,
            fsliCode: acc.fsliCode,
            fsliName: acc.fsliName,
            category: acc.cat,
            fsliBalance: acc.balance,
            noUrut: i + 1,
            ownerAcceptance: 'Accepted',
            mappingConfidence: 0.98
        }).onConflictDoNothing();
    }

    // 2. MATERIALITY & SIMULATION (Approved OM Rp 25 M, PM Rp 18.75 M)
    const simId = `sim-coal-${orgId}-${year}`;
    await db.insert(schema.simulations).values({
        id: simId,
        organizationId: orgId,
        name: `Simulasi Materialitas ICOFR ${year} - PT BNS (Approved Final)`,
        year,
        status: "Approved",
        glSnapshotId: snapshotId,
        omValue: 25000000000,
        pmValue: 18750000000,
        locationCount: 3,
        omPercentage: 5.0,
        haircutPercentage: 75.0,
        basis: "Revenue",
        workflowStatus: "Approved",
        significantAccounts: [
            { code: '10008-000318', name: 'Pendapatan Usaha', balance: 500000000000, isSignificant: true, reason: 'Quantitative (>PM)' },
            { code: '20001-000500', name: 'Beban Pokok Penjualan', balance: 320000000000, isSignificant: true, reason: 'Quantitative (>PM)' },
            { code: '10002-000200', name: 'Piutang Usaha', balance: 120000000000, isSignificant: true, reason: 'Quantitative (>PM)' }
        ],
        createdAt: now,
        updatedAt: now,
    }).onConflictDoNothing();

    // 3. BPM PROCESSES FOR COAL SALES & MINING
    const bpmSalesId = `bpm-coal-sales-${orgId}-${year}`;
    await db.insert(schema.bpmProcesses).values({
        id: bpmSalesId,
        organizationId: orgId,
        noGL: '40001-REV-COAL',
        bpmCode: 'BPM-COAL-01',
        fsliName: 'Pendapatan Usaha',
        name: 'Penjualan Batubara & Pengukuran Timbangan',
        year,
        riskCount: 2,
        controlCount: 3,
        workflowStatus: 'Approved',
        createdAt: now,
    }).onConflictDoNothing();

    // 4. CSA RECORDS & SAMPLES (Effective vs Ineffective)
    const csaEffectiveId = `csa-rec-qc-${orgId}-${year}`;
    await db.insert(schema.csaRecords).values({
        id: csaEffectiveId,
        organizationId: orgId,
        controlId: 'ctrl-rev-04',
        bpmProcessId: bpmSalesId,
        period: `${year}`,
        assessmentDate: new Date(2026, 5, 20),
        result: 'Effective',
        comments: 'Sertifikat kualitas COA dari surveyor independen (SGS/Carsurin) lengkap dan diotorisasi.',
        isDraft: false,
        isBpmConfirmed: true,
        attrA: true,
        attrB: true,
        attrC: true,
        attrD: true,
        line2Status: 'Validated',
        line2Comments: 'Tervalidasi sesuai Lampiran 7 SK-5. Bukti fisik terverifikasi.',
        line2ValidatedDate: new Date(2026, 5, 25),
        workflowStatus: 'Approved'
    }).onConflictDoNothing();

    const csaIneffectiveId = `csa-rec-weighbridge-${orgId}-${year}`;
    await db.insert(schema.csaRecords).values({
        id: csaIneffectiveId,
        organizationId: orgId,
        controlId: 'ctrl-rev-03',
        bpmProcessId: bpmSalesId,
        period: `${year}`,
        assessmentDate: new Date(2026, 7, 14),
        result: 'Ineffective',
        comments: 'Kalibrasi tera metrologi jembatan timbang (weighbridge) terlambat 2 bulan dari jadwal.',
        isDraft: false,
        isBpmConfirmed: true,
        attrA: true,
        attrB: false, // Sertifikat kadaluarsa
        attrC: true,
        attrD: false,
        line2Status: 'Validated',
        line2Comments: 'Dikonfirmasi Ineffective oleh Lini 2. Diteruskan menjadi temuan defisiensi.',
        line2ValidatedDate: new Date(2026, 7, 18),
        workflowStatus: 'Approved'
    }).onConflictDoNothing();

    // 5. TEST RECORDS (TOD 6-Pilar & TOE)
    const testTodId = `test-tod-qc-${orgId}-${year}`;
    await db.insert(schema.testRecords).values({
        id: testTodId,
        organizationId: orgId,
        controlId: 'ctrl-rev-04',
        testType: 'TOD',
        method: 'Inspection & Inquiry',
        period: `${year}`,
        testDate: new Date(2026, 8, 10),
        result: 'Effective',
        comments: 'Desain kontrol memenuhi seluruh 6 pilar Lampiran 8 SK-5.',
        todPilarObjective: true,
        todPilarTiming: true,
        todPilarAuthority: true,
        todPilarReliability: true,
        todPilarCoverage: true,
        todPilarEvidence: true,
    }).onConflictDoNothing();

    const testToeId = `test-toe-wb-${orgId}-${year}`;
    await db.insert(schema.testRecords).values({
        id: testToeId,
        organizationId: orgId,
        controlId: 'ctrl-rev-03',
        testType: 'TOE',
        method: 'Reperformance',
        period: `${year}`,
        testDate: new Date(2026, 8, 15),
        result: 'Ineffective',
        comments: 'Pengujian operasional menemukan 3 transaksi pengiriman batubara tanpa stiker tera kalibrasi sah.',
        sampleSize: 25,
        homogeneityJustification: 'Pengujian acak tiket timbang site penambangan blok timur.',
    }).onConflictDoNothing();

    // 6. DEFICIENCIES & ACTION PLANS
    const defWbId = `def-wb-${orgId}-${year}`;
    await db.insert(schema.deficiencies).values({
        id: defWbId,
        organizationId: orgId,
        controlId: 'ctrl-rev-03',
        bpmProcessId: bpmSalesId,
        period: `${year}`,
        description: 'Jembatan Timbang Site Blok Timur belum dikalibrasi ulang oleh Balai Metrologi resmi (Expired 2 bulan).',
        severity: 'Significant Deficiency',
        identifiedDate: new Date(2026, 7, 15),
        status: 'Open',
        rootCause: 'Keterlambatan proses tender penunjukan vendor pelaksana kalibrasi pihak ketiga.',
        exposureValue: 5000000000,
        likelihood: 'Medium',
        assertions: ['Accuracy', 'Completeness'],
        source: 'Lini 1 - CSA'
    }).onConflictDoNothing();

    const defRevId = `def-rev-cutoff-${orgId}-${year}`;
    await db.insert(schema.deficiencies).values({
        id: defRevId,
        organizationId: orgId,
        controlId: 'ctrl-rev-06',
        bpmProcessId: bpmSalesId,
        period: `${year}`,
        description: 'Potensi salah saji batas pisah (cut-off) pengakuan pendapatan pengapalan batubara FOB vessel akhir periode.',
        severity: 'Material Weakness',
        identifiedDate: new Date(2026, 9, 2),
        status: 'Open',
        rootCause: 'Keterlambatan penerbitan Bill of Lading (B/L) dari agen pelayaran kapal ekspor.',
        exposureValue: 12500000000,
        likelihood: 'High',
        assertions: ['Cut-Off', 'Accuracy'],
        source: 'Lini 3 - Audit'
    }).onConflictDoNothing();

    await db.insert(schema.actionPlans).values({
        id: `plan-wb-${orgId}-${year}`,
        organizationId: orgId,
        deficiencyId: defWbId,
        description: 'Pelaksanaan kalibrasi darurat jembatan timbang bersama UPTD Metrologi Legal setempat dan SOP maintenance berkala.',
        dueDate: new Date(2026, 10, 30),
        status: 'In Progress',
        relatedFunction: 'Logistics & Supply Chain',
        picName: 'Yanto (Manager Logistics)',
        planDescription: 'Sertifikasi ulang sensor beban dan penerbitan Surat Keterangan Hasil Pengujian (SKHP).',
        workflowStatus: 'In Review'
    }).onConflictDoNothing();

    // 7. WBS REPORTS (Principle 14 & 15 Integration)
    await db.insert(schema.wbsReports).values({
        id: `wbs-coal-${orgId}-01`,
        organizationId: orgId,
        reportDate: new Date(2026, 6, 10),
        category: 'Financial Reporting & Operational Fraud',
        description: 'Dugaan manipulasi laporan ritase truk pengangkutan batubara oleh oknum subkontraktor di hauling road.',
        impactMagnitude: 1500000000,
        status: 'Investigating',
        source: 'WBS Portal',
        isFinancialImpact: true
    }).onConflictDoNothing();

    console.log("✅ E2E Demo Scenarios Seeded Successfully!");
};
