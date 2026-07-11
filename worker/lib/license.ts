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
export async function verifyLicense(
  licenseKey: string,
  developerPublicKeyBase64: string,
  partnerPublicKeyBase64?: string
): Promise<LicensePayload | null> {
  try {
    if (!licenseKey) {
        console.error('[LICENSE] Error: licenseKey is empty');
        return null;
    }
    if (!developerPublicKeyBase64) {
        console.error('[LICENSE] Error: developerPublicKeyBase64 is empty');
        return null;
    }
    
    const cleanLicenseKey = licenseKey.trim();
    const parts = cleanLicenseKey.split('.');
    
    if (parts.length !== 2 && parts.length !== 3) {
        console.error('[LICENSE] Error: Invalid key format (must have 2 or 3 parts)');
        return null;
    }

    const cryptoProvider = typeof crypto !== 'undefined' ? crypto : (await import('node:crypto')).webcrypto;
    const cleanDeveloperPublicKey = developerPublicKeyBase64.trim().replace(/\s/g, '');

    const helperVerify = async (data: Buffer, signatureBase64: string, spkiPublicKeyBase64: string): Promise<boolean> => {
      try {
        const signatureBuffer = Buffer.from(signatureBase64, 'base64');
        const publicKeyBuffer = Buffer.from(spkiPublicKeyBase64, 'base64');
        const importedKey = await cryptoProvider.subtle.importKey(
            "spki",
            new Uint8Array(publicKeyBuffer),
            { name: "Ed25519", namedCurve: "Ed25519" },
            false,
            ["verify"]
        );
        return await cryptoProvider.subtle.verify(
            "Ed25519",
            importedKey,
            new Uint8Array(signatureBuffer),
            new Uint8Array(data)
        );
      } catch (e: any) {
        console.error('[LICENSE] Cryptographic operation error:', e.message);
        return false;
      }
    };

    if (parts.length === 2) {
      // Direct Sales: [Payload].[Developer Signature]
      const [payloadBase64, developerSignature] = parts;
      const dataToVerify = Buffer.from(payloadBase64);
      const isDevValid = await helperVerify(dataToVerify, developerSignature, cleanDeveloperPublicKey);
      if (!isDevValid) {
        console.error('[LICENSE] Developer signature verification FAILED');
        return null;
      }
      
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString()) as LicensePayload;
      console.log('[LICENSE] Direct Sales Verification SUCCESS for:', payload.clientName);
      return payload;
    } 
    
    if (parts.length === 3) {
      // Whitelabel Sales: [Payload].[Partner Signature].[Developer Signature]
      const [payloadBase64, partnerSignature, developerSignature] = parts;
      const dataToVerify = Buffer.from(payloadBase64);

      // Verify Developer Signature
      const isDevValid = await helperVerify(dataToVerify, developerSignature, cleanDeveloperPublicKey);
      if (!isDevValid) {
        console.error('[LICENSE] Developer signature verification FAILED');
        return null;
      }

      // Verify Partner Signature
      const activePartnerPublicKey = (partnerPublicKeyBase64 || process.env.PARTNER_PUBLIC_KEY || '').trim().replace(/\s/g, '');
      if (!activePartnerPublicKey) {
        console.error('[LICENSE] Whitelabel Verification failed: PARTNER_PUBLIC_KEY is not configured.');
        return null;
      }

      const isPartnerValid = await helperVerify(dataToVerify, partnerSignature, activePartnerPublicKey);
      if (!isPartnerValid) {
        console.error('[LICENSE] Partner signature verification FAILED');
        return null;
      }

      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString()) as LicensePayload;
      console.log('[LICENSE] Whitelabel Sales Verification SUCCESS for:', payload.clientName);
      return payload;
    }

    return null;
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
