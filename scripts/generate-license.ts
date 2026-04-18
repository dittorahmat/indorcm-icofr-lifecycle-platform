/**
 * IndoRCM Pro - License Generator Utility
 * This script is for INTERNAL USE ONLY to generate license keys for clients.
 */

import { input } from '@inquirer/prompts';

async function generateKeyPair() {
  const { publicKey, privateKey } = await Bun.crypto.generateKeyPair("ed25519");
  
  console.log('\n--- NEW KEY PAIR GENERATED ---');
  console.log('PUBLIC_KEY (Put this in .env):');
  console.log(Buffer.from(publicKey).toString('base64'));
  console.log('\nPRIVATE_KEY (Keep this secret!):');
  console.log(Buffer.from(privateKey).toString('base64'));
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
  
  const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');
  
  const signature = await Bun.crypto.sign(
    "ed25519",
    privateKeyBuffer,
    Buffer.from(payloadBase64)
  );

  const signatureBase64 = Buffer.from(signature).toString('base64');
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
