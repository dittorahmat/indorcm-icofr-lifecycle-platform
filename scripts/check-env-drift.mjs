import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function withoutComments(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');
}

function readJsonc(file) {
  const raw = readFileSync(path.join(root, file), 'utf8');
  const withoutBlockComments = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutLineComments = withoutComments(withoutBlockComments);
  return JSON.parse(withoutLineComments);
}

const configFiles = readdirSync(root)
  .filter((file) => /^wrangler\..+\.jsonc$/.test(file))
  .sort();

let envExample = '';
try {
  envExample = readFileSync(path.join(root, '.env.example'), 'utf8');
} catch (err) {
  console.error('[check:env-drift] FAIL: .env.example file not found.');
  process.exit(1);
}

let hasError = false;

for (const file of configFiles) {
  try {
    const config = readJsonc(file);
    const workerName = config.name;
    if (typeof workerName === 'string' && workerName.startsWith('icofr-')) {
      const suffix = workerName.replace(/^icofr-/, '').toUpperCase();
      const expectedVar = `${suffix}_DATABASE_URL`;
      if (!envExample.includes(expectedVar)) {
        console.error(`[check:env-drift] FAIL: .env.example is missing "${expectedVar}" for config ${file} (worker ${workerName}).`);
        hasError = true;
      }
    }
  } catch (err) {
    console.error(`[check:env-drift] FAIL: Could not parse ${file}: ${err.message}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`[check:env-drift] OK: .env.example documents all ${configFiles.length} isolated instance database variables.`);
