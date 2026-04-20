import fs from 'node:fs';
import os from 'node:os';

/**
 * License structure after decryption/decoding
 */
export interface LicensePayload {
  machineCode: string;
  expiryDate: string; // ISO String
  clientName: string;
  tier: string;
}

/**
 * Verifies a license key using WebCrypto (Standard for Cloudflare/Edge)
 */
export async function verifyLicense(licenseKey: string, publicKeyBase64: string): Promise<LicensePayload | null> {
  try {
    if (!licenseKey) {
        console.error('[LICENSE] Error: licenseKey is empty');
        return null;
    }
    if (!publicKeyBase64) {
        console.error('[LICENSE] Error: publicKeyBase64 is empty');
        return null;
    }
    
    const cleanLicenseKey = licenseKey.trim();
    const cleanPublicKeyBase64 = publicKeyBase64.trim().replace(/\s/g, '');

    const [payloadBase64, signatureBase64] = cleanLicenseKey.split('.');
    if (!payloadBase64 || !signatureBase64) {
        console.error('[LICENSE] Error: Invalid key format (missing dot)');
        return null;
    }

    // IMPORTANT: Match the data that was signed in generate-license.ts
    // We signed the ASCII characters of the Base64 string, so we verify that.
    const dataToVerify = Buffer.from(payloadBase64); 
    const signatureBuffer = Buffer.from(signatureBase64, 'base64');
    const publicKeyBuffer = Buffer.from(cleanPublicKeyBase64, 'base64');

    console.log('[LICENSE] Attempting verification...');
    const cryptoProvider = typeof crypto !== 'undefined' ? crypto : (await import('node:crypto')).webcrypto;
    
    try {
        const importedKey = await cryptoProvider.subtle.importKey(
            "spki",
            publicKeyBuffer,
            { name: "Ed25519", namedCurve: "Ed25519" },
            false,
            ["verify"]
        );

        const isValid = await cryptoProvider.subtle.verify(
            "Ed25519",
            importedKey,
            signatureBuffer,
            dataToVerify
        );

        if (!isValid) {
            console.error('[LICENSE] Signature verification FAILED (Cryptographic mismatch)');
            return null;
        }
    } catch (cryptoErr: any) {
        console.error('[LICENSE] Crypto API Error:', cryptoErr.message);
        return null;
    }

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString()) as LicensePayload;
    console.log('[LICENSE] Verification SUCCESS for:', payload.clientName);
    return payload;
  } catch (error: any) {
    console.error('[LICENSE] Fatal Verification error:', error.message);
    return null;
  }
}

/**
 * Checks if the license is valid for the current machine and time.
 */
export function checkLicenseStatus(payload: LicensePayload, machineFingerprint: string, lastHeartbeat?: Date): string | null {
  const now = new Date();
  if (payload.machineCode !== machineFingerprint) {
    console.warn(`[LICENSE] Machine mismatch: Expected ${payload.machineCode}, got ${machineFingerprint}`);
    return 'MACHINE_MISMATCH';
  }
  if (now > new Date(payload.expiryDate)) return 'LICENSE_EXPIRED';
  if (lastHeartbeat && now < new Date(lastHeartbeat.getTime() - 5 * 60 * 1000)) return 'TIME_TRAVEL_DETECTED';
  return null;
}

/**
 * Generates a unique machine fingerprint.
 */
export function getMachineFingerprint(): string {
  try {
    const isNodeLike = typeof process !== 'undefined' && process.versions && process.versions.node;
    if (isNodeLike) {
        if (fs.existsSync('/host_machine_id')) return `HOST-${fs.readFileSync('/host_machine_id', 'utf8').trim()}`;
        if (fs.existsSync('/etc/machine-id')) return `LOCAL-${fs.readFileSync('/etc/machine-id', 'utf8').trim()}`;
        
        try {
            const interfaces = os.networkInterfaces();
            const candidates: string[] = [];
            for (const name of Object.keys(interfaces)) {
              const net = interfaces[name];
              if (net) {
                  for (const itf of net) {
                    if (!itf.internal && itf.mac && itf.mac !== '00:00:00:00:00:00') {
                      candidates.push(itf.mac.replace(/:/g, '').toUpperCase());
                    }
                  }
              }
            }
            if (candidates.length > 0) return `MAC-${candidates.sort()[0]}`;
        } catch (e) {
          // Fallback if network interfaces cannot be accessed
        }
    }
  } catch (error) {
    // General fingerprinting error fallback
  }
  return 'CLOUDFLARE-EDGE-NODE';
}
