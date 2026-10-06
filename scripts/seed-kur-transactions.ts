import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../worker/db/schema';
import { eq, and } from 'drizzle-orm';

// Tech-debt fix: no hardcoded credentials. Require DATABASE_URL from env (.dev.vars/.env).
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL_MISSING: set DATABASE_URL in .dev.vars/.env before running seed-kur-transactions');

const queryClient = postgres(dbUrl);
const db = drizzle(queryClient, { schema });

const orgIds = ['org-bumn-default', 'org-1'];

const sampleDebtors = [
  { name: 'Budi Santoso', business: 'Toko Kelontong Berkah' },
  { name: 'Siti Aminah', business: 'Warung Makan Sederhana' },
  { name: 'Ahmad Dahlan', business: 'Pertanian Padi & Palawija' },
  { name: 'Dewi Lestari', business: 'Kerajinan Batik Tulis' },
  { name: 'Eko Prasetyo', business: 'Bengkel Sepeda Motor' },
  { name: 'Rina Wijaya', business: 'Usaha Olahan Makanan' },
  { name: 'Hendra Gunawan', business: 'Budidaya Ikan Lele' },
  { name: 'Sri Rahayu', business: 'Toko Pakaian & Tekstil' },
  { name: 'Bambang Supriyanto', business: 'Perkebunan Kelapa Sawit' },
  { name: 'Yulia Ratnasari', business: 'Salon & Perawatan Wajah' },
  { name: 'CV Maju Jaya Abadi', business: 'Perdagangan Hasil Tani' },
  { name: 'PT Sinar Usaha Mandiri', business: 'Distribusi Sembako' },
  { name: 'UD Murni Sentosa', business: 'Peternakan Ayam Broiler' },
  { name: 'Agus Setiawan', business: 'Jasa Angkutan Barang' },
  { name: 'Nurul Hidayah', business: 'Toko Alat Tulis & Foto Kopi' },
];

const kurTypes = ['KUR Mikro', 'KUR Ritel', 'KUR Super Mikro', 'KUR Penempatan PMI'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAmount(type: string): number {
  if (type === 'KUR Super Mikro') {
    return Math.floor(Math.random() * 90 + 10) * 100000; // 1M - 10M
  } else if (type === 'KUR Mikro') {
    return Math.floor(Math.random() * 90 + 10) * 1000000; // 10M - 100M
  } else {
    return Math.floor(Math.random() * 40 + 10) * 10000000; // 100M - 500M
  }
}

async function seed() {
  console.log('🚀 Seeding 100 Transaction Details for BPM "Pencairan Kredit KUR"...');

  try {
    const orgs = await db.select().from(schema.organization);
    const orgIds = orgs.map(o => o.id);
    if (orgIds.length === 0) {
      orgIds.push('org-bumn-default');
    }
    for (const orgId of orgIds) {
      // 1. Ensure BPM Process exists for years 2026 and 2024
      for (const year of [2026, 2025, 2024]) {
        const bpmId = `bpm-kur-${orgId}-${year}`;
        await db.insert(schema.bpmProcesses).values({
          id: bpmId,
          organizationId: orgId,
          noGL: '12071-000400 KUR',
          bpmCode: 'BPM-KUR-01',
          fsliName: 'Kredit',
          name: 'Pencairan Kredit KUR',
          year: year,
          riskCount: 2,
          controlCount: 3,
          workflowStatus: 'Approved',
          createdAt: new Date(),
        }).onConflictDoNothing();
      }

      const defaultBpmId = `bpm-kur-${orgId}-2026`;

      // Also ensure GL Row snapshot/entry if applicable
      const glCodes = ['12071-000400 KUR', '12071-000400'];

      for (const noGLCode of glCodes) {
        // Delete existing mock transactions for clean re-seed
        await db.delete(schema.transactionDetails).where(
          and(
            eq(schema.transactionDetails.organizationId, orgId),
            eq(schema.transactionDetails.noGL, noGLCode)
          )
        );

        const newRecords: Array<typeof schema.transactionDetails.$inferInsert> = [];

        // Generate 100 records for 2026 (primary) and 50 for 2024
        for (const targetYear of [2026, 2024]) {
          const recordCount = targetYear === 2026 ? 100 : 50;
          for (let i = 1; i <= recordCount; i++) {
            const deb = getRandomElement(sampleDebtors);
            const kType = getRandomElement(kurTypes);
            const amount = getRandomAmount(kType);
            const isDebit = Math.random() > 0.15; // 85% Debit (pencairan), 15% Credit (penyesuaian/angsuran)
            const dcFlag = isDebit ? 'D' : 'C';

            // Spread dates uniformly across targetYear (0..7 for 2026 up to August)
            const maxMonth = targetYear === 2026 ? 7 : 11;
            const month = Math.floor(((i - 1) % recordCount) / (recordCount / (maxMonth + 1))); // 0..maxMonth
            const day = Math.floor(Math.random() * 27) + 1;
            const transDate = new Date(targetYear, month, day, 9 + (i % 8), (i * 13) % 60);

            const refSeq = String(i).padStart(4, '0');
            const refNo = `PKUR-${targetYear}-${refSeq}`;
            
            const descPrefix = isDebit ? 'Pencairan' : 'Koreksi/Setoran';
            const description = `${descPrefix} ${kType} - ${deb.name} (${deb.business})`;

            newRecords.push({
              id: `tx-kur-${orgId}-${noGLCode.replace(/\s+/g, '_')}-${targetYear}-${refSeq}`,
              organizationId: orgId,
              noGL: noGLCode,
              bpmProcessId: defaultBpmId,
              refNo,
              transDate,
              description,
              currency: 'IDR',
              dcFlag,
              amount,
            });
          }
        }

        // Insert batch
        await db.insert(schema.transactionDetails).values(newRecords);
        console.log(`✅ Successfully seeded 100 records for org '${orgId}' with GL '${noGLCode}'`);
      }
    }

    console.log('🎉 All 100 Transaction Details seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding KUR transactions:', error);
  } finally {
    await queryClient.end();
  }
}

seed();
