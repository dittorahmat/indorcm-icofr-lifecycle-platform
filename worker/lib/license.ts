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
 * Verifies a license key against the configured public key.
 */
export async function verifyLicense(licenseKey: string, publicKeyBase64: string): Promise<LicensePayload | null> {
  try {
    if (!licenseKey || !publicKeyBase64) return null;
    
    const [payloadBase64, signatureBase64] = licenseKey.split('.');
    if (!payloadBase64 || !signatureBase64) return null;

    const payloadBuffer = Buffer.from(payloadBase64, 'base64');
    const signatureBuffer = Buffer.from(signatureBase64, 'base64');
    const publicKeyBuffer = Buffer.from(publicKeyBase64, 'base64');

    // Detect if we are in Cloudflare Workers or Node/Bun
    // Bun.crypto is only available in Bun
    const isBun = typeof Bun !== 'undefined';
    
    if (isBun) {
        const isValid = await Bun.crypto.verify(
          "ed25519",
          publicKeyBuffer,
          signatureBuffer,
          payloadBuffer
        );
        if (!isValid) return null;
    } else {
        // Fallback for Node/Cloudflare (requires subtle crypto or compatibility)
        // For simplicity in Cloudflare, if we skip license, this won't be called.
        console.warn('[LICENSE] Crypto verification not implemented for this runtime.');
        return null;
    }

    const payload = JSON.parse(payloadBuffer.toString()) as LicensePayload;
    return payload;
  } catch (error) {
    console.error('[LICENSE] Verification error:', error);
    return null;
  }
}

/**
 * Checks if the license is valid for the current machine and time.
 */
export function checkLicenseStatus(payload: LicensePayload, machineFingerprint: string, lastHeartbeat?: Date): string | null {
  const now = new Date();

  if (payload.machineCode !== machineFingerprint) {
    return 'MACHINE_MISMATCH';
  }

  if (now > new Date(payload.expiryDate)) {
    return 'LICENSE_EXPIRED';
  }

  if (lastHeartbeat && now < new Date(lastHeartbeat.getTime() - 5 * 60 * 1000)) {
    return 'TIME_TRAVEL_DETECTED';
  }

  return null;
}

/**
 * Generates a unique machine fingerprint.
 * Safe for Cloudflare (returns dummy value instead of crashing).
 */
export function getMachineFingerprint(): string {
  try {
    // Check if we are in a runtime that supports fs (Node/Bun)
    const isNodeLike = typeof process !== 'undefined' && process.versions && process.versions.node;
    
    if (isNodeLike) {
        if (fs.existsSync('/host_machine_id')) {
          return `HOST-${fs.readFileSync('/host_machine_id', 'utf8').trim()}`;
        }
        if (fs.existsSync('/etc/machine-id')) {
            return `LOCAL-${fs.readFileSync('/etc/machine-id', 'utf8').trim()}`;
        }
        const networkInterfaces = os.networkInterfaces();
        for (const interfaceName in networkInterfaces) {
          const networkInterface = networkInterfaces[interfaceName];
          if (networkInterface) {
            for (const info of networkInterface) {
              if (!info.internal && info.mac !== '00:00:00:00:00:00') {
                return `MAC-${info.mac.replace(/:/g, '')}`;
              }
            }
          }
        }
    }
  } catch (error) {
    // Ignore and fallback
  }

  return 'CLOUDFLARE-EDGE-NODE';
}
