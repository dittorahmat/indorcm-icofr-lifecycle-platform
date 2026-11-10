// scripts/sync-skills.mjs
// Synchronizes the canonical skills in .agents/skills/ across all other agent mirror directories.
import { existsSync, readdirSync, statSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = process.cwd();
const SOURCE_DIR = resolve(ROOT, '.agents', 'skills');

const TARGET_DIRS = [
  resolve(ROOT, '.claude', 'skills'),
  resolve(ROOT, '.commandcode', 'skills'),
  resolve(ROOT, '.hermes', 'skills'),
  resolve(ROOT, '.openhands', 'skills'),
  resolve(ROOT, '.qwen', 'skills'),
  resolve(ROOT, '.zcode', 'skills'),
  resolve(ROOT, 'skills'),
];

if (!existsSync(SOURCE_DIR)) {
  console.error(`Source directory not found: ${SOURCE_DIR}`);
  process.exit(1);
}

function copyRecursive(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`Syncing skills from .agents/skills to ${TARGET_DIRS.length} mirrors...`);

let count = 0;
for (const targetDir of TARGET_DIRS) {
  copyRecursive(SOURCE_DIR, targetDir);
  count++;
}

console.log(`OK    sync:skills — successfully synced across ${count} mirrors.`);
process.exit(0);
