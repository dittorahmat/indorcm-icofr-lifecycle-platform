import { neon } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePgJs } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from './schema';

import { AsyncLocalStorage } from 'node:async_hooks';

// Generic driver-agnostic type for Drizzle PostgreSQL clients
export type DrizzleDb = PgDatabase<any, typeof schema>;

let dbInstance: DrizzleDb | null = null;
let lastUrl: string | null = null;
let hasLoggedDriver = false;

// AsyncLocalStorage to share request-scoped DB instance and connection pool
export const dbLocalStorage = new AsyncLocalStorage<{ db: DrizzleDb; pool?: Pool }>();

// Schema discipline: the single source of DDL truth is versioned drizzle/*.sql
// (runtime DDL consolidated in 0048_consolidate_runtime_ddl.sql).
// Run `npx drizzle-kit push` / `npx drizzle-kit migrate` after schema changes.

export const createDbAndPool = (url?: string): { db: DrizzleDb; pool?: Pool } => {
  const dbUrl = url || (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined);

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is missing! Check your .dev.vars or .env file.');
    // Return a dummy object that throws a clearer error when used
    const dummyDb = {
      select: () => { throw new Error('DATABASE_URL_MISSING') },
      insert: () => { throw new Error('DATABASE_URL_MISSING') },
      update: () => { throw new Error('DATABASE_URL_MISSING') },
      delete: () => { throw new Error('DATABASE_URL_MISSING') },
    } as any;
    return { db: dummyDb };
  }

  // 1. Detect runtimes
  const isCloudflare = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
  const isNode = typeof process !== 'undefined' && process.release && process.release.name === 'node';

  // If URL changed, reset cached instances
  if (lastUrl && lastUrl !== dbUrl) {
    dbInstance = null;
  }
  lastUrl = dbUrl;

  let db: DrizzleDb;
  let pool: Pool | undefined;

  // 2. Cache globally for Node.js (persistent on-premise processes)
  if (!isCloudflare && dbInstance) {
    db = dbInstance;
  } else if (isNode && !isCloudflare) {
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: postgres.js (Direct TCP Connection - On-Premise)');
      hasLoggedDriver = true;
    }
    const queryClient = postgres(dbUrl);
    dbInstance = drizzlePgJs(queryClient, { schema }) as any;
    db = dbInstance!;
  } else if (dbUrl.startsWith('http://') || dbUrl.startsWith('https://')) {
    // 3. Serverless/Edge Runtime (Cloudflare Workers)
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: neon-http (HTTP Stateless - No Transaction support)');
      hasLoggedDriver = true;
    }
    const client = neon(dbUrl);
    db = drizzleHttp(client, { schema }) as any;
  } else {
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: neon-serverless (WebSocket Pool - Supports Transactions)');
      hasLoggedDriver = true;
    }

    pool = new Pool({ connectionString: dbUrl });
    if (typeof (pool as any).on === 'function') {
      (pool as any).on('error', (err: any) => {
        console.warn('⚠️ Neon WebSocket Pool connection error:', err.message || err);
      });
    }

    db = drizzleWs(pool, { schema }) as any;
  }

  return { db, pool };
};

export const getDb = (url?: string): DrizzleDb => {
  const store = dbLocalStorage.getStore();
  if (store) {
    return store.db;
  }
  return createDbAndPool(url).db;
};

