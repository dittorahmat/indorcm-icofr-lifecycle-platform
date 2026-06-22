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

  if (dbInstance && lastUrl === url) {
    return dbInstance;
  }

  lastUrl = url;

  // 1. Detect Node.js runtime (On-Premise Node Server local hosting)
  const isNode = typeof process !== 'undefined' && process.release && process.release.name === 'node';

  if (isNode) {
    console.log('📦 Database Driver: postgres.js (Direct TCP Connection - On-Premise)');
    const queryClient = postgres(url);
    dbInstance = drizzlePgJs(queryClient, { schema }) as any;
    return dbInstance!;
  }

  // 2. Serverless/Edge Runtime (Cloudflare Workers demo)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('📦 Database Driver: neon-http (HTTP Stateless - No Transaction support)');
    const client = neon(url);
    dbInstance = drizzleHttp(client, { schema }) as any;
  } else {
    console.log('📦 Database Driver: neon-serverless (WebSocket Pool - Supports Transactions)');
    const pool = new Pool({ connectionString: url });
    dbInstance = drizzleWs(pool, { schema }) as any;
  }

  return dbInstance!;
};

