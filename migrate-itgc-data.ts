import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './worker/db/schema';
import { sql } from 'drizzle-orm';

// Bun secara otomatis membaca file .env, jadi kita tidak butuh dotenv.config()

async function migrateData() {
    console.log("🚀 Memulai migrasi data ITGC (Bun Mode)...");
    
    // Gunakan URL default jika process.env.DATABASE_URL kosong (fallback untuk kemudahan)
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
        console.error("❌ Error: DATABASE_URL tidak ditemukan di environment variable.");
        console.log("Tips: Pastikan file .env ada di folder root.");
        process.exit(1);
    }

    const client = neon(dbUrl);
    const db = drizzle(client, { schema });

    try {
        console.log("⏳ Menyalin data dari automated_type ke automated_control_type...");
        
        // Pindahkan data menggunakan raw SQL
        await db.execute(sql`
            UPDATE rcm_controls 
            SET automated_control_type = automated_type 
            WHERE automated_control_type IS NULL 
              AND automated_type IS NOT NULL;
        `);

        console.log("✅ Data berhasil dipindahkan!");
        
        // Cek hasil
        const items = await db.select({
            id: schema.rcmControls.id,
            old_value: schema.rcmControls.automatedType,
            new_value: schema.rcmControls.automatedControlType
        }).from(schema.rcmControls).limit(10);

        console.log("\n📊 Sampel data setelah migrasi:");
        console.table(items);

    } catch (error) {
        console.error("❌ Terjadi kesalahan saat migrasi:", error);
    }
}

migrateData();
