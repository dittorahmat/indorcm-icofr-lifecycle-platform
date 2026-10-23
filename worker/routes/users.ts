import { Hono } from 'hono';
import type { HonoEnv } from '../app';
import profile from './users/profile';
import admin from './users/admin';
import departments from './users/departments';
import settings from './users/settings';
import notificationPreferences from './users/notification-preferences';
import devRoutes from './users/dev';

/**
 * Barrel for `/api/users*`: five focused sub-apps plus the dev tools.
 * URLs are byte-identical to the pre-split monolith (route-lock test owns this).
 */
const users = new Hono<HonoEnv>();

users.route('/', profile);
users.route('/', admin);
users.route('/', departments);
users.route('/', settings);
users.route('/', notificationPreferences);
// --- DEV TOOLS: extracted to `worker/routes/users/dev.ts` (URLs unchanged) ---
users.route('/', devRoutes);

export default users;
