import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type DrizzleDb = NeonHttpDatabase<typeof schema>;

let dbInstance: DrizzleDb | null = null;
let lastUrl: string | null = null;

export const getDb = (url: string) => {
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

  const client = neon(url);
  dbInstance = drizzle(client, { schema });
  lastUrl = url;
  return dbInstance;
};
