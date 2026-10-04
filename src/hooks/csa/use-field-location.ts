import { useCallback, useState } from 'react';
import type { CSAEvidenceMeta } from '@shared/types';

export type FieldGpsStatus = NonNullable<CSAEvidenceMeta['gpsStatus']>;

export interface FieldLocation {
  status: FieldGpsStatus;
  lat?: number;
  lng?: number;
  accuracyM?: number;
  capturedAt: number;
}

const GEO_TIMEOUT_MS = 10000;
const GEO_MAX_AGE_MS = 60000;

function isSecureLocationContext(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export function requestFieldLocation(): Promise<FieldLocation> {
  const capturedAt = Date.now();
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve({ status: 'unavailable', capturedAt });
  }
  if (!isSecureLocationContext()) {
    return Promise.resolve({ status: 'unavailable', capturedAt });
  }
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ status: 'timeout', capturedAt });
      }
    }, GEO_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve({
          status: 'granted',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          capturedAt,
        });
      },
      (err) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        if (err.code === err.TIMEOUT) {
          resolve({ status: 'timeout', capturedAt });
        } else if (err.code === err.PERMISSION_DENIED) {
          resolve({ status: 'denied', capturedAt });
        } else {
          resolve({ status: 'unavailable', capturedAt });
        }
      },
      { timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS, enableHighAccuracy: false },
    );
  });
}

export function useFieldLocation() {
  const [location, setLocation] = useState<FieldLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const captureLocation = useCallback(async (): Promise<FieldLocation> => {
    setIsLocating(true);
    try {
      const loc = await requestFieldLocation();
      setLocation(loc);
      return loc;
    } finally {
      setIsLocating(false);
    }
  }, []);

  return { location, isLocating, captureLocation };
}
