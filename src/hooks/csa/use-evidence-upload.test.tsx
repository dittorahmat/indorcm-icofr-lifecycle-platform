import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { buildEvidenceFormData, compressEvidenceImage, useEvidenceUpload } from './use-evidence-upload';

vi.mock('@/lib/api-client', () => ({
  api: vi.fn(),
}));

import { api } from '@/lib/api-client';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'EvidenceTestWrapper';
  return Wrapper;
}

describe('useEvidenceUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds consistent metadata payload from form and archive entry points', () => {
    const file = new File(['x'], 'bukti.jpg', { type: 'image/jpeg' });
    const target = { file, previewUrl: 'blob:1', sIdx: 2, cId: 'CTL-1', csaId: 'csa-9', scheduleId: 'sch-1' };
    const fd = buildEvidenceFormData(target, file, { lat: -6.2, lng: 106.8, accuracyM: 20, capturedAt: 1700000000000, gpsStatus: 'granted' });
    expect(fd.get('csaId')).toBe('csa-9');
    expect(fd.get('sIdx')).toBe('2');
    expect(fd.get('cId')).toBe('CTL-1');
    expect(fd.get('scheduleId')).toBe('sch-1');
    expect(fd.get('lat')).toBe('-6.2');
    expect(fd.get('gpsStatus')).toBe('granted');
  });

  it('returns original file for non-image compression fallback', async () => {
    const file = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
    await expect(compressEvidenceImage(file)).resolves.toBe(file);
  });

  it('keeps preview before upload and preserves file on failure for retry', async () => {
    vi.mocked(api).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ url: 'https://cdn/bukti.jpg' });
    const onUploaded = vi.fn();
    const { result } = renderHook(() => useEvidenceUpload({ csaId: 'csa-1', onUploaded }), { wrapper: wrapper() });
    const file = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.selectFile(0, 'CTL-1', file);
    });
    expect(result.current.pending?.file).toBe(file);
    expect(vi.mocked(api)).not.toHaveBeenCalled();

    act(() => {
      result.current.uploadPending({ capturedAt: 1, gpsStatus: 'denied' });
    });
    await waitFor(() => expect(result.current.failed).not.toBeNull());
    expect(result.current.pending).not.toBeNull();
    expect(onUploaded).not.toHaveBeenCalled();

    act(() => {
      result.current.retry({ capturedAt: 1, gpsStatus: 'denied' });
    });
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    expect(onUploaded).toHaveBeenCalledWith({ sIdx: 0, cId: 'CTL-1' }, 'https://cdn/bukti.jpg', { capturedAt: 1, gpsStatus: 'denied' });
    expect(result.current.pending).toBeNull();
  });
});
