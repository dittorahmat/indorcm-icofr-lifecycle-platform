import { getDb } from '../worker/db/index';
import * as schema from '../worker/db/schema';
import { BpmService } from '../worker/services/bpm-service';
import { eq } from 'drizzle-orm';

async function backfillBpmNodes() {
    console.log("🚀 Memulai backfill Risk & Control dari Diagram BPM ke tabel RCM...");
    
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("❌ Error: DATABASE_URL tidak ditemukan di environment variable.");
        process.exit(1);
    }

    const db = getDb(dbUrl);
    const bpmService = new BpmService(db);

    try {
        // Ambil user pertama sebagai fallback untuk audit log (agar tidak melanggar foreign key constraint)
        const dbUsers = await db.select().from(schema.user).limit(1);
        const fallbackUserId = dbUsers[0]?.id;
        if (!fallbackUserId) {
            console.error("❌ Error: Tidak ditemukan user di database untuk dijadikan fallback audit log.");
            process.exit(1);
        }
        console.log(`👤 Menggunakan fallback user ID: "${fallbackUserId}"`);

        // Ambil semua diagram dari database
        const diagrams = await db.select().from(schema.bpmDiagrams);
        console.log(`📊 Menemukan ${diagrams.length} diagram untuk diproses.`);

        let successCount = 0;
        let errorCount = 0;

        for (const diagram of diagrams) {
            console.log(`⏳ Memproses diagram: "${diagram.name}" (ID: ${diagram.id}) - Tahun: ${diagram.year}`);
            try {
                // Siapkan body seperti saat update diagram dari UI
                const body = {
                    name: diagram.name,
                    year: diagram.year,
                    subProcess: diagram.subProcess ?? '',
                    nodes: diagram.nodes || [],
                    edges: diagram.edges || [],
                    metadata: diagram.metadata || {}
                };

                const orgId = diagram.organizationId;
                
                // Pastikan userId valid di tabel user
                let userId = diagram.createdBy;
                if (userId) {
                    const exists = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);
                    if (exists.length === 0) {
                        userId = fallbackUserId;
                    }
                } else {
                    userId = fallbackUserId;
                }

                // Jalankan updateDiagram untuk mentrigger sinkronisasi ulang
                await bpmService.updateDiagram(orgId, userId, diagram.id, body);
                console.log(`✅ Berhasil sinkronisasi RCM untuk diagram: "${diagram.name}"`);
                successCount++;
            } catch (err) {
                console.error(`❌ Gagal memproses diagram "${diagram.name}":`, err);
                errorCount++;
            }
        }

        console.log(`\n🎉 Proses Selesai!`);
        console.log(`- Sukses: ${successCount}`);
        console.log(`- Gagal: ${errorCount}`);

    } catch (error) {
        console.error("❌ Terjadi kesalahan utama:", error);
    }
    
    // Matikan proses secara eksplisit agar koneksi pool tertutup dan command selesai
    process.exit(0);
}

backfillBpmNodes();
