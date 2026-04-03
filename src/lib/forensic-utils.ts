export interface EvidenceMetadata {
  gpsVerified: boolean;
  latitude?: number;
  longitude?: number;
  timestampVerified: boolean;
  capturedAt?: Date;
  hash: string;
}

export async function analyzeEvidenceMetadata(file: File): Promise<EvidenceMetadata> {
  // Simulate EXIF parsing or forensic analysis (FR10)
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock forensic data
      const isImage = file.type.startsWith('image/');
      const isValid = isImage && file.size > 1024;
      
      resolve({
        gpsVerified: isValid,
        latitude: isValid ? -6.2088 : undefined, // Example: Jakarta coords
        longitude: isValid ? 106.8456 : undefined,
        timestampVerified: true,
        capturedAt: new Date(file.lastModified),
        hash: crypto.randomUUID().replace(/-/g, '').substring(0, 16), // Simulated file hash
      });
    }, 1500);
  });
}

export async function promptBiometricAuth(action: string = 'authenticate'): Promise<boolean> {
  // Simulate Biometric Authentication (FR9)
  // In a real production app, this would use the WebAuthn API to trigger Windows Hello/FaceID/TouchID.
  // We use a simulated delay here to ensure it works across all demo environments without requiring WebAuthn setup.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 2000);
  });
}
