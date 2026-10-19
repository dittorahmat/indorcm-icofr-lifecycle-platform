import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import JavaScriptObfuscator from 'javascript-obfuscator';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'dist-whitelabel');

function cleanDirectory(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src: string, dest: string, excludeDirs: string[] = []) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();

  if (isDirectory) {
    if (excludeDirs.some(dir => src.endsWith(dir))) {
      return;
    }
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursive(path.join(src, child), path.join(dest, child), excludeDirs);
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  } else {
    // `.claude/skills/*` are symlinks into the skill marketplace, which is not
    // part of the repository: CI checks out a dangling link, `existsSync` is
    // false and `copyFileSync` would throw ENOENT and fail the whole release.
    console.warn(`⏩ Skipping absent source: ${path.relative(ROOT_DIR, src)} (dangling symlink)`);
  }
}

async function buildAndObfuscate() {
  console.log('=== Starting Whitelabel Build & Obfuscation ===');
  
  // 1. Bersihkan folder output
  cleanDirectory(OUTPUT_DIR);
  
  // 2. Salin seluruh file Wrapper & UI mentah (lewati node_modules, dist, .git, dll)
  console.log('Copying UI Wrapper source files...');
  const excludes = [
    'node_modules',
    'dist',
    'dist-whitelabel',
    '.git',
    '.github',
    'openspec',
    'scripts' // Kita tidak menyertakan script generator internal Anda ke Mitra
  ];
  
  fs.readdirSync(ROOT_DIR).forEach((file) => {
    if (!excludes.includes(file)) {
      copyRecursive(path.join(ROOT_DIR, file), path.join(OUTPUT_DIR, file), excludes);
    }
  });

  // 3. Proses Obfuscate Core Lisensi
  console.log('Transpiling & Obfuscating Core SDK components...');
  const licenseSrcPath = path.resolve(ROOT_DIR, 'worker/lib/license.ts');
  const licenseDestJsPath = path.resolve(OUTPUT_DIR, 'worker/core-sdk/license.js');
  const licenseDestDtsPath = path.resolve(OUTPUT_DIR, 'worker/core-sdk/license.d.ts');
  
  fs.mkdirSync(path.dirname(licenseDestJsPath), { recursive: true });

  const licenseSource = fs.readFileSync(licenseSrcPath, 'utf8');

  // Transpile TS -> JS
  const transpileResult = ts.transpileModule(licenseSource, {
    compilerOptions: { 
      module: ts.ModuleKind.CommonJS, 
      target: ts.ScriptTarget.ES2022,
      removeComments: true
    }
  });

  // Obfuscate JS
  const obfuscatedResult = JavaScriptObfuscator.obfuscate(transpileResult.outputText, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    numbersToExpressions: true,
    simplify: true,
    stringArray: true,
    stringArrayThreshold: 0.75
  });

  fs.writeFileSync(licenseDestJsPath, obfuscatedResult.getObfuscatedCode(), 'utf8');

  // 4. Update path import di worker/app.ts hasil copy whitelabel
  console.log('Patching import paths in output worker/app.ts...');
  const destAppPath = path.resolve(OUTPUT_DIR, 'worker/app.ts');
  if (fs.existsSync(destAppPath)) {
    let appContent = fs.readFileSync(destAppPath, 'utf8');
    appContent = appContent.replace(
      "from './lib/license';",
      "from './core-sdk/license';"
    );
    fs.writeFileSync(destAppPath, appContent, 'utf8');
  }

  // Buat .d.ts minimal agar TypeScript compiler Mitra tidak error
  const dtsContent = `
export interface LicensePayload {
  machineCode: string;
  expiryDate: string;
  clientName: string;
  tier: string;
}
export function verifyLicense(licenseKey: string, developerPublicKeyBase64: string, partnerPublicKeyBase64?: string): Promise<LicensePayload | null>;
export function checkLicenseStatus(payload: LicensePayload, machineFingerprint: string, lastHeartbeat?: Date): string | null;
export function getMachineFingerprint(): string;
`;
  fs.writeFileSync(licenseDestDtsPath, dtsContent.trim(), 'utf8');

  // 4. Hapus file-file core mentah dari folder output whitelabel
  const rawLicenseInDest = path.resolve(OUTPUT_DIR, 'worker/lib/license.ts');
  if (fs.existsSync(rawLicenseInDest)) {
    fs.unlinkSync(rawLicenseInDest);
  }
  
  console.log('\n✅ Build Whitelabel berhasil dirakit di:', OUTPUT_DIR);
  console.log('Core SDK ter-obfuscate dipasang di worker/core-sdk/license.js');
}

buildAndObfuscate().catch(err => {
  console.error('Fatal build error:', err);
  process.exit(1);
});
