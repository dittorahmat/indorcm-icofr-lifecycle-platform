import { serve } from '@hono/node-server';
import { createApp } from './app';

const app = createApp();

// Port can be configured via environment variable
const port = Number(process.env.PORT) || 3001;

console.log(`🚀 IndoRCM On-Premise Server running on http://localhost:${port}`);

serve({
  fetch: (request) => {
    // Manually construct the env object from process.env for On-Premise
    const env = {
      DATABASE_URL: process.env.DATABASE_URL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      SKIP_LICENSE: process.env.SKIP_LICENSE,
      LICENSE_PUBLIC_KEY: process.env.LICENSE_PUBLIC_KEY,
    };
    
    return app.fetch(request, env);
  },
  port,
});
