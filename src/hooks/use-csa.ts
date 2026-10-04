import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { CSARecord, BPMDiagram, BPMProcess } from '@shared/types';
import { promptBiometricAuth } from '@/lib/forensic-utils';
import { useSearchParams } from 'react-router-dom';
import { useCSAForm, CSAFormValues } from './csa/use-csa-form';
export type { CSAFormValues };
import { useCSADiagramLink } from './csa/use-csa-diagram-link';
import { useConfirm } from './use-confirm';
import { checkSignOff } from './csa/sign-off-guard';
import { buildEvidenceFormData, compressEvidenceImage } from './csa/use-evidence-upload';
import type { CSAEvidenceMeta } from '@shared/types';

interface UseCSAProps {
  bpmProcessId: string;
  scheduleId?: string;
  initialSamples?: any[];
  controls?: any[];
  year?: string | number;
}

export function useCSA({ bpmProcessId, scheduleId, initialSamples = [], controls: propControls = [], year }: UseCSAProps) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeCsaId, setActiveCsaId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeUploadRow, setActiveUploadRow] = useState<{ sIdx: number; cId: string } | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const manualViewOverride = useRef<'list' | 'form' | null>(null);

  const {
    form,
    fields,
    replaceSamples,
    append,
    watchSamples,
    anyPointFailed
  } = useCSAForm();

  // 1. Queries
  const { data: bpmProcess } = useQuery({
    queryKey: ['bpm-process', bpmProcessId],
    queryFn: () => api<{ items: BPMProcess[] }>(`/api/bpm-processes?id=${bpmProcessId}`).then(res => res.items[0]),
    enabled: !!bpmProcessId
  });

  const { data: diagram } = useQuery({
    queryKey: ['bpm-diagram-by-gl', bpmProcess?.noGL, bpmProcess?.name],
    queryFn: () => api<BPMDiagram>(`/api/bpm-diagrams/by-gl/${bpmProcess?.noGL}?subProcess=${encodeURIComponent(bpmProcess?.name || '')}`),
    enabled: !!bpmProcess?.noGL
  });

  const { data: csaList, isLoading: isListLoading } = useQuery({
    queryKey: ['csa-list', bpmProcessId, year],
    queryFn: () => {
      const params = new URLSearchParams();
      if (bpmProcessId) params.append('bpmProcessId', bpmProcessId);
      if (year) params.append('year', year.toString());
      return api<{ items: CSARecord[] }>(`/api/csa?${params.toString()}`);
    },
    enabled: !!bpmProcessId && view === 'list'
  });

  const { data: linkedScheduleRecord, isLoading: isCheckingSchedule } = useQuery({
    queryKey: ['csa-record-by-schedule', scheduleId],
    queryFn: () => api<{ items: CSARecord[] }>(`/api/csa?scheduleId=${scheduleId}`).then(res => res.items[0]),
    enabled: !!scheduleId && !isInitialized && manualViewOverride.current !== 'list'
  });

  const { data: activeCsa } = useQuery({
    queryKey: ['csa-detail', activeCsaId],
    queryFn: () => api<CSARecord>(`/api/csa/${activeCsaId}`),
    enabled: !!activeCsaId
  });

  const { bpmRiskControlPairs, activeControls } = useCSADiagramLink(diagram, propControls);

  const isReadOnly = useMemo(() => {
    if (!activeCsaId) return false;
    if (!activeCsa) return false; 
    if (activeCsa.isDraft) return false;
    return true;
  }, [activeCsaId, activeCsa]);

  const initializeFromSamples = useCallback((samples: any[]) => {
    const newSamples = samples.map(s => {
      const controlResults: Record<string, any> = {};
      if (bpmRiskControlPairs.length > 0) {
        bpmRiskControlPairs.forEach(pair => {
          controlResults[pair.controlId] = {
            implemented: false,
            riskId: pair.riskId,
            riskName: pair.riskName,
            controlName: pair.controlName,
            evidenceUrl: '',
            comment: ''
          };
        });
      } else {
        activeControls.forEach(ctrl => {
          controlResults[ctrl.id] = { implemented: false };
        });
      }

      let sampleRef = "";
      if ("glDesc" in s) sampleRef = s.glDesc;
      else if ("description" in s) sampleRef = (s as any).description || "N/A";

      return { sampleRef, glRowId: (s as any).id, controlResults };
    });
    replaceSamples(newSamples);
    setIsInitialized(true);
    setView('form');
  }, [bpmRiskControlPairs, activeControls, replaceSamples]);

  // 4. Effects
  useEffect(() => {
    setIsInitialized(false);
    setActiveCsaId(null);
    setView('list');
    form.reset();
    manualViewOverride.current = null;
  }, [bpmProcessId, scheduleId, form]);

  useEffect(() => {
    if (initialSamples.length > 0 && !isInitialized && view === 'list') {
      manualViewOverride.current = null;
    } else if (initialSamples.length === 0 && !activeCsaId && manualViewOverride.current === null) {
      setView('list');
    }
  }, [initialSamples.length, isInitialized, view, activeCsaId]);

  useEffect(() => {
    if (isInitialized || manualViewOverride.current === 'list') return;

    if (scheduleId) {
      if (isCheckingSchedule) return;

      if (linkedScheduleRecord) {
        setActiveCsaId(linkedScheduleRecord.id);
        setView('form');
        setIsInitialized(true);
      } else if (initialSamples.length > 0) {
        initializeFromSamples(initialSamples);
      }
    } 
    else if (initialSamples.length > 0 && view !== 'form') {
      initializeFromSamples(initialSamples);
    }
  }, [scheduleId, linkedScheduleRecord, isCheckingSchedule, initialSamples, isInitialized, view, initializeFromSamples]);

  useEffect(() => {
    if (bpmProcess?.standardTestProcedure && !activeCsaId && !form.getValues('testProcedure')) {
      form.setValue('testProcedure', bpmProcess.standardTestProcedure);
    }
  }, [bpmProcess, activeCsaId, form]);

  useEffect(() => {
    if (activeCsa && activeCsaId && view !== 'list' && manualViewOverride.current !== 'list') {
      form.reset({
        period: activeCsa.period,
        result: activeCsa.result,
        comments: activeCsa.comments || '',
        testProcedure: (activeCsa as any).testProcedure || '',
        archiveLocation: (activeCsa as any).archiveLocation || '',
        samplingMethodology: (activeCsa as any).samplingMethodology || '',
        documentList: (activeCsa as any).documentList || '',
        isBpmConfirmed: true,
        samples: activeCsa.samples.map(s => {
          const transformedResults: Record<string, any> = {};
          if (s.controlResults) {
            Object.entries(s.controlResults).forEach(([id, val]) => {
              transformedResults[id] = typeof val === 'boolean' ? { implemented: val } : val;
            });
          }
          return {
            sampleRef: s.sampleRef,
            glRowId: s.glRowId,
            controlResults: transformedResults
          };
        })
      });
      setView('form');
    }
  }, [activeCsa, activeCsaId, view, form]);

  useEffect(() => {
    if (view === 'list') {
      setActiveCsaId(null);
      setIsInitialized(true);
      manualViewOverride.current = 'list';
    }
  }, [view]);

  // 6. Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const url = activeCsaId ? `/api/csa/${activeCsaId}` : '/api/csa';
      const method = activeCsaId ? 'PUT' : 'POST';
      return api<CSARecord>(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: (response: any, variables: any) => {
      toast.success(variables.isDraft ? "Draft saved successfully" : "CSA Sign-off successful");
      queryClient.invalidateQueries({ queryKey: ['csa-list'] });
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
      
      if (!variables.isDraft) {
        setView('list');
        setActiveCsaId(null);
        setIsInitialized(true);
        manualViewOverride.current = 'list';
      } else {
        const id = response.id || activeCsaId;
        setActiveCsaId(id);
        form.reset(form.getValues(), { keepDirty: false });
      }
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ sIdx, cId, file, meta }: { sIdx: number; cId: string; file: File; meta?: CSAEvidenceMeta }) => {
      const finalFile = await compressEvidenceImage(file);
      const formData = buildEvidenceFormData(
        { file: finalFile, previewUrl: '', sIdx, cId, csaId: activeCsaId ?? undefined, scheduleId },
        finalFile,
        { capturedAt: Date.now(), gpsStatus: 'unavailable', ...(meta ?? {}) },
      );
      return api<{ url: string }>('/api/upload', { method: 'POST', body: formData });
    },
    onSuccess: (data, variables) => {
      const path = `samples.${variables.sIdx}.controlResults.${variables.cId}.evidenceUrl` as any;
      form.setValue(path, data.url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
      if (variables.meta) {
        const metaPath = `samples.${variables.sIdx}.controlResults.${variables.cId}.evidenceMeta` as any;
        form.setValue(metaPath, variables.meta, { shouldDirty: true, shouldTouch: true });
      }
      toast.success("Bukti berhasil diunggah");
      setActiveUploadRow(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/csa/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success("Assessment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['csa-list'] });
      queryClient.invalidateQueries({ queryKey: ['csa-schedules'] });
    }
  });

  const onSaveDraft = async () => {
    const values = form.getValues();
    createMutation.mutate({
      ...values,
      id: activeCsaId || undefined,
      isDraft: true,
      scheduleId,
      bpmProcessId,
      testProcedure: values.testProcedure,
      archiveLocation: values.archiveLocation,
      organizationId: (initialSamples[0] as any)?.organizationId || searchParams.get('orgId'),
    });
  };

  const onSubmit = async (values: CSAFormValues) => {
    const check = checkSignOff(values);
    if (check.blocked && check.reason === 'missing-evidence') {
      toast.error("Setiap kontrol yang 'Pass' wajib melampirkan bukti (evidence) sebelum sign-off.");
      return;
    }
    const realResult = check.realResult;
    if (check.blocked && check.reason === 'failed-effective') {
       toast.error("Tidak dapat sign-off sebagai Effective karena terdapat kontrol yang gagal.");
       return;
    }

    setIsAuthenticating(true);
    const verified = await promptBiometricAuth('authenticate');
    setIsAuthenticating(false);

    if (!verified) {
      toast.error("Sign-off authentication failed");
      return;
    }

    createMutation.mutate({
      ...values,
      id: activeCsaId || undefined,
      result: realResult,
      isDraft: false,
      scheduleId,
      bpmProcessId,
      testProcedure: values.testProcedure,
      archiveLocation: values.archiveLocation,
      organizationId: (initialSamples[0] as any)?.organizationId || searchParams.get('orgId'),
    });
  };

  const handleBackToList = () => {
    manualViewOverride.current = 'list';
    setActiveCsaId(null);
    setView('list');
    form.reset();
    setIsInitialized(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Hapus Asesmen",
      description: "Hapus asesmen ini secara permanen? Data sampel dan bukti juga akan terhapus.",
      variant: 'destructive'
    });
    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  return {
    view, setView,
    activeCsaId, setActiveCsaId,
    activeCsa,
    csaList, isListLoading,
    bpmProcess,
    diagram,
    form,
    fields, append,
    watchSamples,
    activeControls,
    bpmRiskControlPairs,
    anyPointFailed,
    isReadOnly,
    isAuthenticating,
    activeUploadRow, setActiveUploadRow,
    createMutation,
    uploadMutation,
    onSaveDraft,
    onSubmit,
    handleBackToList,
    handleDelete,
    manualViewOverride,
    setIsInitialized
  };
}
