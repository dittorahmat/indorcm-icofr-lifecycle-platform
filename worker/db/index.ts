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

export const getDb = (url: string): DrizzleDb => {
  if (!url) {
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

  // 2. Only cache globally for Node.js (persistent on-premise processes)
  if (!isCloudflare && dbInstance && lastUrl === url) {
    return dbInstance;
  }

  lastUrl = url;

  if (isNode && !isCloudflare) {
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: postgres.js (Direct TCP Connection - On-Premise)');
      hasLoggedDriver = true;
    }
    const queryClient = postgres(url);
    dbInstance = drizzlePgJs(queryClient, { schema }) as any;
    return dbInstance!;
  }

  // 3. Serverless/Edge Runtime (Cloudflare Workers - instantiate fresh to avoid terminated WebSocket pools)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: neon-http (HTTP Stateless - No Transaction support)');
      hasLoggedDriver = true;
    }
    const client = neon(url);
    return drizzleHttp(client, { schema }) as any;
  } else {
    if (!hasLoggedDriver) {
      console.log('📦 Database Driver: neon-serverless (WebSocket Pool - Supports Transactions)');
      hasLoggedDriver = true;
    }
    const pool = new Pool({ connectionString: url });
    return drizzleWs(pool, { schema }) as any;
  }
};

