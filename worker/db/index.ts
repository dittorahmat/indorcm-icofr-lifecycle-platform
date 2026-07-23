import { neon } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePgJs } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from './schema';

// Generic driver-agnostic type for Drizzle PostgreSQL clients
export type DrizzleDb = PgDatabase<any, typeof schema>;

let dbInstance: DrizzleDb | null = null;
let lastUrl: string | null = null;
let hasLoggedDriver = false;

export const getDb = (url?: string): DrizzleDb => {
  const dbUrl = url || (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined);

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is missing! Check your .dev.vars or .env file.');
    // Return a dummy object that throws a clearer error when used
    return {
      select: () => { throw new Error('DATABASE_URL_MISSING') },
      insert: () => { throw new Error('DATABASE_URL_MISSING') },
      update: () => { throw new Error('DATABASE_URL_MISSING') },
      delete: () => { throw new Error('DATABASE_URL_MISSING') },
    } as any;
  }

  // 1. Detect runtimes
  const isCloudflare = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
  const isNode = typeof process !== 'undefined' && process.release && process.release.name === 'node';

  // If URL changed, reset cached instances
  if (lastUrl && lastUrl !== dbUrl) {
    dbInstance = null;
  }
  lastUrl = dbUrl;

  // 2. Cache globally for Node.js (persistent on-premise processes)
  if (!isCloudflare && dbInstance) {
    return dbInstance;
  }

  if (isNode && !isCloudflare) {
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: postgres.js (Direct TCP Connection - On-Premise)');
      hasLoggedDriver = true;
    }
    const queryClient = postgres(dbUrl);
    dbInstance = drizzlePgJs(queryClient, { schema }) as any;
    return dbInstance!;
  }

  // 3. Serverless/Edge Runtime (Cloudflare Workers)
  if (dbUrl.startsWith('http://') || dbUrl.startsWith('https://')) {
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: neon-http (HTTP Stateless - No Transaction support)');
      hasLoggedDriver = true;
    }
    const client = neon(dbUrl);
    return drizzleHttp(client, { schema }) as any;
  } else {
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: neon-serverless (WebSocket Pool - Supports Transactions)');
      hasLoggedDriver = true;
    }

    const pool = new Pool({ connectionString: dbUrl });
    if (typeof (pool as any).on === 'function') {
      (pool as any).on('error', (err: any) => {
        console.warn('⚠️ Neon WebSocket Pool connection error:', err.message || err);
      });
    }

    return drizzleWs(pool, { schema }) as any;
  }
};
