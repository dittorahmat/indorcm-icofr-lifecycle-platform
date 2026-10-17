import { Hono } from 'hono';
import type { HonoEnv } from '../app';
import finalizeRoutes from './migration/finalize';
import rolloverRoutes from './migration/rollover';

const migration = new Hono<HonoEnv>();

// Domain split (pola baku): each sub-app owns its path verbatim, mounted at '/'
// so `POST /migration/finalize` and `POST /migration/rollover` stay
// byte-identical. `default export` name is unchanged, so worker/app.ts is not.
migration.route('/', finalizeRoutes);
migration.route('/', rolloverRoutes);

export default migration;
