#!/usr/bin/env node
/**
 * Zero-dependency post-deploy verification probe for IndoGRC Pro on VPS.
 * Verifies live PM2 service, PostgreSQL connectivity, and Better-Auth runtime readiness.
 */
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

const BACKEND_HOST = process.env.BACKEND_HOST || 'localhost';
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '3001', 10);
const LIVE_DIR = process.env.LIVE_DIR || '/var/www/icofr';
const TIMEOUT_MS = 10_000;

function probeEndpoint(path) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.request(
      {
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path,
        method: 'GET',
        timeout: TIMEOUT_MS,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            path,
            status: res.statusCode || 0,
            durationMs: Date.now() - start,
            ok: (res.statusCode || 0) < 500,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        path,
        status: 0,
        durationMs: Date.now() - start,
        error: err.message,
        ok: false,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        status: 0,
        durationMs: TIMEOUT_MS,
        error: 'TIMEOUT',
        ok: false,
      });
    });

    req.end();
  });
}

async function run() {
  console.log(`[Probe] Inspecting IndoGRC Pro backend at http://${BACKEND_HOST}:${BACKEND_PORT}...`);

  const results = await Promise.all([
    probeEndpoint('/api/settings'),
    probeEndpoint('/api/auth/get-session'),
  ]);

  let allOk = true;

  for (const r of results) {
    if (r.ok) {
      console.log(`  ✓ ${r.path} -> HTTP ${r.status} (${r.durationMs}ms)`);
    } else {
      allOk = false;
      console.error(`  ✗ ${r.path} -> FAILED (${r.error || `HTTP ${r.status}`}) after ${r.durationMs}ms`);
    }
  }

  // Check live static directory if present
  const liveIndex = `${LIVE_DIR}/index.html`;
  if (existsSync(liveIndex)) {
    console.log(`  ✓ Live static asset verified at ${liveIndex}`);
  } else {
    console.log(`  ℹ Live static directory not on host (testing locally or Docker)`);
  }

  if (!allOk) {
    console.error('[Probe] FATAL: Health probe checks failed.');
    process.exit(1);
  }

  console.log('[Probe] All health checks passed successfully.');
}

run();
