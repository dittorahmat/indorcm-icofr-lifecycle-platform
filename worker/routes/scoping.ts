import { Hono } from "hono";
import type { HonoEnv } from '../app';
import simulationRoutes from './scoping/scoping-simulations';
import simulationLifecycle from './scoping/scoping-simulation-lifecycle';
import simulationAccounts from './scoping/scoping-simulation-accounts';
import snapshotRoutes from './scoping/scoping-snapshots';

const scoping = new Hono<HonoEnv>();

// Domain split (anti god-file): each sub-app owns its path prefix verbatim,
// mounted at '/' so every historical route URL stays byte-identical.
scoping.route('/', simulationRoutes);
scoping.route('/', simulationLifecycle);
scoping.route('/', simulationAccounts);
scoping.route('/', snapshotRoutes);

export default scoping;
