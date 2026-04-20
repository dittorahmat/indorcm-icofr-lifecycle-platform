/**
 * IndoGRC Pro - License Generator Utility
 * This script is for INTERNAL USE ONLY to generate license keys for clients.
 */

import { input } from '@inquirer/prompts';
import crypto from 'node:crypto';

async function generateKeyPair() {
  // Use standard node:crypto for maximum compatibility
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  
  // Convert PEM to a clean Base64 string for .env
  const cleanPublic = publicKey.toString()
    .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');
  const cleanPrivate = privateKey.toString()
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n|\r/g, '');

  console.log('\n--- NEW KEY PAIR GENERATED ---');
  console.log('PUBLIC_KEY (Put this in .env or Cloudflare Vars):');
  console.log(cleanPublic);
  console.log('\nPRIVATE_KEY (Keep this secret!):');
  console.log(cleanPrivate);
  console.log('-------------------------------\n');
}

async function signLicense() {
  const privateKeyBase64 = await input({ message: 'Enter PRIVATE_KEY (Base64):' });
  const machineCode = await input({ message: 'Enter Client Machine Code:' });
  const clientName = await input({ message: 'Enter Client Name:' });
  const expiryDays = await input({ message: 'Enter Validity (Days):', default: '365' });
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

  const payload = {
    machineCode,
    clientName,
    expiryDate: expiryDate.toISOString(),
    tier: 'enterprise',
    issuedAt: new Date().toISOString()
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64');
  
  // Format back to PEM for node:crypto
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;
  
  const signature = crypto.sign(
    null,
    Buffer.from(payloadBase64),
    crypto.createPrivateKey(privateKeyPem)
  );

  const signatureBase64 = signature.toString('base64');
  const licenseKey = `${payloadBase64}.${signatureBase64}`;

  console.log('\n--- LICENSE GENERATED ---');
  console.log('Client:', clientName);
  console.log('Expires:', expiryDate.toLocaleDateString());
  console.log('\nLICENSE_KEY:');
  console.log(licenseKey);
  console.log('-------------------------\n');
}

const action = process.argv[2];

if (action === 'gen-keys') {
  generateKeyPair();
} else if (action === 'sign') {
  signLicense();
} else {
  console.log('Usage:');
  console.log('  bun run scripts/generate-license.ts gen-keys  - Generate a new Ed25519 key pair');
  console.log('  bun run scripts/generate-license.ts sign      - Generate a signed license key');
}
