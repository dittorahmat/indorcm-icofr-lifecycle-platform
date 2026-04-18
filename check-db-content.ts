import { documents } from './worker/db/schema';
import { getDb } from './worker/db/index';
import { sql } from 'drizzle-orm';

async function checkData() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found in environment");
        return;
    }
    
    const db = getDb(url);
    try {
        const res = await db.select({ 
            id: documents.id, 
            title: documents.title, 
            contentLength: sql`length(${documents.content})` 
        }).from(documents);
        
        console.log("--- DATABASE DOCUMENTS INFO ---");
        console.table(res);
        
        if (res.length > 0) {
            // Cek sample teksnya dikit
            const sample = await db.select({ content: documents.content })
                .from(documents)
                .limit(1);
            console.log("\n--- PREVIEW CONTENT (First 100 chars) ---");
            console.log(sample[0]?.content?.substring(0, 100) || "EMPTY");
        }
    } catch (e: any) {
        console.error("Error query:", e.message);
    }
    process.exit(0);
}

checkData();
