import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { CSAEvidenceMeta } from '@shared/types';

export type GpsStatus = NonNullable<CSAEvidenceMeta['gpsStatus']>;
export type EvidenceMeta = CSAEvidenceMeta;

export interface PendingEvidence {
  file: File;
  previewUrl: string;
  sIdx: number;
  cId: string;
  csaId?: string;
  scheduleId?: string;
}

interface UseEvidenceUploadOptions {
  csaId?: string;
  scheduleId?: string;
  onUploaded?: (target: { sIdx: number; cId: string }, url: string, meta: EvidenceMeta) => void;
}

const MAX_EDGE = 1600;

export async function compressEvidenceImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    if (typeof createImageBitmap !== 'function') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function buildEvidenceFormData(target: PendingEvidence, file: File, meta: EvidenceMeta): FormData {
  const formData = new FormData();
  formData.append('file', file);
  if (target.csaId) formData.append('csaId', target.csaId);
  formData.append('sIdx', String(target.sIdx));
  formData.append('cId', target.cId);
  if (target.scheduleId) formData.append('scheduleId', target.scheduleId);
  if (meta.lat !== undefined) formData.append('lat', String(meta.lat));
  if (meta.lng !== undefined) formData.append('lng', String(meta.lng));
  if (meta.accuracyM !== undefined) formData.append('accuracyM', String(meta.accuracyM));
  if (meta.capturedAt !== undefined) formData.append('capturedAt', String(meta.capturedAt));
  if (meta.gpsStatus) formData.append('gpsStatus', meta.gpsStatus);
  return formData;
}

export function useEvidenceUpload(options: UseEvidenceUploadOptions = {}) {
  const { csaId, scheduleId, onUploaded } = options;
  const [pending, setPending] = useState<PendingEvidence | null>(null);
  const [failed, setFailed] = useState<PendingEvidence | null>(null);
  const metaRef = useRef<EvidenceMeta>({ capturedAt: Date.now(), gpsStatus: 'unavailable' });
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;

  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  const selectFile = useCallback(
    (sIdx: number, cId: string, file: File) => {
      if (pending) URL.revokeObjectURL(pending.previewUrl);
      metaRef.current = { capturedAt: Date.now(), gpsStatus: metaRef.current.gpsStatus ?? 'unavailable' };
      setPending({ file, previewUrl: URL.createObjectURL(file), sIdx, cId, csaId, scheduleId });
      setFailed(null);
    },
    [csaId, pending, scheduleId],
  );

  const cancelPending = useCallback(() => {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setFailed(null);
  }, [pending]);

  const uploadMutation = useMutation({
    mutationFn: async ({ target, meta }: { target: PendingEvidence; meta: EvidenceMeta }) => {
      const finalFile = await compressEvidenceImage(target.file);
      const formData = buildEvidenceFormData(target, finalFile, meta);
      return api<{ url: string }>('/api/upload', { method: 'POST', body: formData });
    },
    onSuccess: (data, variables) => {
      const url = data.url;
      onUploadedRef.current?.({ sIdx: variables.target.sIdx, cId: variables.target.cId }, url, variables.meta);
      if (pending && pending.sIdx === variables.target.sIdx && pending.cId === variables.target.cId) {
        URL.revokeObjectURL(pending.previewUrl);
      }
      setPending(null);
      setFailed(null);
      toast.success('Bukti berhasil diunggah');
    },
    onError: (_, variables) => {
      setFailed(variables.target);
    },
  });

  const uploadPending = useCallback(
    (meta?: EvidenceMeta) => {
      if (!pending || uploadMutation.isPending) return;
      const resolved: EvidenceMeta = meta ?? metaRef.current;
      uploadMutation.mutate({ target: pending, meta: resolved });
    },
    [pending, uploadMutation],
  );

  const retry = useCallback(
    (meta?: EvidenceMeta) => {
      const target = failed ?? pending;
      if (!target || uploadMutation.isPending) return;
      const resolved: EvidenceMeta = meta ?? metaRef.current;
      uploadMutation.reset();
      uploadMutation.mutate({ target, meta: resolved });
    },
    [failed, pending, uploadMutation],
  );

  const setGpsMeta = useCallback((meta: EvidenceMeta) => {
    metaRef.current = meta;
  }, []);

  return {
    pending,
    failed,
    isUploading: uploadMutation.isPending,
    selectFile,
    cancelPending,
    uploadPending,
    retry,
    setGpsMeta,
    getMeta: () => metaRef.current,
  };
}
