import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { rcmItemsRoute } from './rcm/rcm-items';
import { rcmControlsRoute } from './rcm/rcm-controls';
import { rcmMatrixRoute } from './rcm/rcm-matrix';
import { rcmImportRoute } from './rcm/rcm-import';

const rcm = new Hono<HonoEnv>();

rcm.route('/', rcmItemsRoute);
rcm.route('/', rcmMatrixRoute);
rcm.route('/', rcmControlsRoute);
rcm.route('/', rcmImportRoute);

export default rcm;
