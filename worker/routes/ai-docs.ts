import { Hono } from "hono";
import type { HonoEnv } from '../app';
import documentsRoutes from './ai-docs/documents';
import chatRoutes from './ai-docs/chat';
import filesRoutes from './ai-docs/files';

const aiDocsApp = new Hono<HonoEnv>();

// Domain split (anti god-file): each sub-app owns its path prefix verbatim,
// mounted at '/' so every historical route URL stays byte-identical.
aiDocsApp.route('/', documentsRoutes);
aiDocsApp.route('/', chatRoutes);
aiDocsApp.route('/', filesRoutes);

export default aiDocsApp;
