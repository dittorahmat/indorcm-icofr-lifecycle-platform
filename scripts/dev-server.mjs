import { spawn } from 'node:child_process';
import http from 'node:http';

/**
 * Dev Server Helper Runner
 * Handles cross-platform spawning, readiness probing, and clean teardown.
 * Usage:
 *   node scripts/dev-server.mjs probe [port]     - Checks if localhost is answering
 *   node scripts/dev-server.mjs start [port]     - Spawns vite dev server and waits until ready
 */

const action = process.argv[2] || 'probe';
const port = parseInt(process.argv[3] || '3000', 10);

function probePort(targetPort) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: targetPort,
        method: 'GET',
        path: '/',
        timeout: 1500,
      },
      (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForPort(targetPort, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const isUp = await probePort(targetPort);
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  if (action === 'probe') {
    const isUp = await probePort(port);
    console.log(`Port ${port} status: ${isUp ? 'READY (listening)' : 'DOWN (not listening)'}`);
    process.exit(isUp ? 0 : 1);
  }

  if (action === 'start') {
    console.log(`Spawning dev server on port ${port}...`);
    const isAlreadyUp = await probePort(port);
    if (isAlreadyUp) {
      console.log(`Port ${port} is already up and listening.`);
      process.exit(0);
    }

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npmCmd, ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      detached: false,
    });

    const isReady = await waitForPort(port);
    if (isReady) {
      console.log(`Dev server is ready at http://localhost:${port}`);
      process.exit(0);
    } else {
      console.error(`Timed out waiting for dev server on port ${port}`);
      child.kill('SIGTERM');
      process.exit(1);
    }
  }

  console.error(`Unknown action: ${action}. Use 'probe' or 'start'.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
