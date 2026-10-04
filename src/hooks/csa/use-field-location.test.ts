import { describe, it, expect, vi, afterEach } from 'vitest';
import { requestFieldLocation } from './use-field-location';

describe('requestFieldLocation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves unavailable when geolocation is missing', async () => {
    vi.stubGlobal('navigator', {});
    const loc = await requestFieldLocation();
    expect(loc.status).toBe('unavailable');
  });

  it('resolves denied when permission is denied and does not throw', async () => {
    const getCurrentPosition = vi.fn((_ok: unknown, err: (e: { code: number; TIMEOUT: number; PERMISSION_DENIED: number }) => void) => {
      err({ code: 1, TIMEOUT: 3, PERMISSION_DENIED: 1 });
    });
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    vi.stubGlobal('window', window);
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const loc = await requestFieldLocation();
    expect(loc.status).toBe('denied');
    expect(loc.capturedAt).toBeGreaterThan(0);
  });

  it('resolves granted with coordinates on success', async () => {
    const getCurrentPosition = vi.fn((ok: (p: unknown) => void) => {
      ok({ coords: { latitude: -6.2, longitude: 106.8, accuracy: 20 } });
    });
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const loc = await requestFieldLocation();
    expect(loc.status).toBe('granted');
    expect(loc.lat).toBe(-6.2);
    expect(loc.lng).toBe(106.8);
    expect(loc.accuracyM).toBe(20);
  });
});
