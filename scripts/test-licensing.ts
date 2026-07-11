import crypto from 'node:crypto';
import { verifyLicense, getMachineFingerprint, checkLicenseStatus } from '../worker/lib/license';

async function runTests() {
  console.log('=== STARTING HYBRID LICENSE VERIFICATION TESTS ===\n');

  // 1. Generate Developer Key Pair
  const devKeys = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const devPublicBase64 = devKeys.publicKey.toString()
    .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');

  // 2. Generate Partner Key Pair
  const partnerKeys = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const partnerPublicBase64 = partnerKeys.publicKey.toString()
    .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');

  const machineFingerprint = getMachineFingerprint();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

  const payload = {
    machineCode: machineFingerprint,
    clientName: 'PT Batubara Sejahtera',
    expiryDate: expiryDate.toISOString(),
    tier: 'enterprise',
    issuedAt: new Date().toISOString()
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64');

  // --- TEST CASE 1: DIRECT SALES (2-PART KEY) ---
  console.log('--- Test Case 1: Direct Sales (Single-Signature) ---');
  const devSignature = crypto.sign(
    null,
    Buffer.from(payloadBase64),
    crypto.createPrivateKey(devKeys.privateKey)
  ).toString('base64');

  const directLicenseKey = `${payloadBase64}.${devSignature}`;
  console.log('Direct key format valid. Verifying...');
  const directPayload = await verifyLicense(directLicenseKey, devPublicBase64);
  if (directPayload && directPayload.clientName === payload.clientName) {
    console.log('✅ TEST 1 PASSED: Direct sales key successfully verified.\n');
  } else {
    console.error('❌ TEST 1 FAILED\n');
    process.exit(1);
  }

  // --- TEST CASE 2: WHITELABEL SALES (3-PART KEY) ---
  console.log('--- Test Case 2: Whitelabel Sales (Double-Signature) ---');
  const partnerSignature = crypto.sign(
    null,
    Buffer.from(payloadBase64),
    crypto.createPrivateKey(partnerKeys.privateKey)
  ).toString('base64');

  const whitelabelLicenseKey = `${payloadBase64}.${partnerSignature}.${devSignature}`;
  console.log('Whitelabel key format valid. Verifying...');
  const whitelabelPayload = await verifyLicense(whitelabelLicenseKey, devPublicBase64, partnerPublicBase64);
  if (whitelabelPayload && whitelabelPayload.clientName === payload.clientName) {
    console.log('✅ TEST 2 PASSED: Whitelabel sales key successfully verified.\n');
  } else {
    console.error('❌ TEST 2 FAILED\n');
    process.exit(1);
  }

  // --- TEST CASE 3: TAMPERED KEY (EXPECT FAILURE) ---
  console.log('--- Test Case 3: Tampered Whitelabel Key ---');
  const tamperedKey = `${payloadBase64}.${partnerSignature}.invalidSignatureBytes`;
  const tamperedPayload = await verifyLicense(tamperedKey, devPublicBase64, partnerPublicBase64);
  if (tamperedPayload === null) {
    console.log('✅ TEST 3 PASSED: Invalid signature successfully rejected.\n');
  } else {
    console.error('❌ TEST 3 FAILED: Tampered key accepted!\n');
    process.exit(1);
  }

  console.log('=== ALL LICENSING TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
