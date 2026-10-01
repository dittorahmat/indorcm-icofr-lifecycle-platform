import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api-client';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({ data: null }),
  },
}));

describe('api client resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses valid json responses successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: vi.fn().mockResolvedValue({ success: true, data: { message: 'hello' } }),
    } as any);

    const data = await api<{ message: string }>('/api/test');
    expect(data).toEqual({ message: 'hello' });
  });

  it('handles HTML 524 Cloudflare Gateway Timeout without json syntax crash', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 524,
      statusText: 'Gateway Timeout',
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html; charset=UTF-8' : null),
      },
      text: vi.fn().mockResolvedValue('<!DOCTYPE html><html><head><title>524 Gateway Timeout</title></head></html>'),
    } as any);

    await expect(api('/api/bpm-diagrams/123')).rejects.toThrow(
      'Waktu pemrosesan server habis (524/504 Gateway Timeout)'
    );
  });

  it('handles HTML 401 Unauthorized cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html' : null),
      },
      text: vi.fn().mockResolvedValue('<!DOCTYPE html>Login Required'),
    } as any);

    await expect(api('/api/bpm-diagrams/123')).rejects.toThrow(
      'Sesi telah berakhir atau tidak sah'
    );
  });

  it('handles HTML 404 cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html' : null),
      },
      text: vi.fn().mockResolvedValue('<!DOCTYPE html>Not Found'),
    } as any);

    await expect(api('/api/bpm-diagrams/123')).rejects.toThrow(
      'Data tidak ditemukan pada server (404 Not Found'
    );
  });
});
