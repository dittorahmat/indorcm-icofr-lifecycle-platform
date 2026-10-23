import { useState, useMemo, useEffect, useCallback, useReducer } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { CSARecord, BPMDiagram, BPMProcess } from '@shared/types';
import { promptBiometricAuth } from '@/lib/forensic-utils';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { FieldPath } from 'react-hook-form';
import { useCSAForm, CSAFormValues } from './csa/use-csa-form';
export type { CSAFormValues };
import { useCSADiagramLink } from './csa/use-csa-diagram-link';
import { useConfirm } from './use-confirm';
import { checkSignOff } from './csa/sign-off-guard';
import { resolvePostSaveView, shouldEnterForm, shouldFetchList } from './csa/csa-view-transition';
import { buildEvidenceFormData, compressEvidenceImage } from './csa/use-evidence-upload';
import { csaKeysForYear, invalidateCsaYear } from './csa/csa-keys';
import { INITIAL_CSA_SESSION, csaSessionReducer } from './csa/csa-session';
import type { CSAEvidenceMeta } from '@shared/types';

/** One row the workspace can open with; the BPM worksheet and GL grid both emit it. */
interface CsaInitialSample {
  id?: string;
  glDesc?: string;
  description?: string;
  organizationId?: string;
}

interface UseCSAProps {
  bpmProcessId: string;
  scheduleId?: string;
  initialSamples?: readonly CsaInitialSample[];
  controls?: any[];
  /** Year-scoped: required so the fetch key and every invalidation share the tuple. */
  year: string;
}

export function useCSA({ bpmProcessId, scheduleId, initialSamples = [], controls: propControls = [], year }: UseCSAProps) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(['csa_hub', 'common']);
  const [session, dispatch] = useReducer(csaSessionReducer, INITIAL_CSA_SESSION);
  const { view, activeCsaId, isInitialized, manualOverride } = session;
  const [activeUploadRow, setActiveUploadRow] = useState<{ sIdx: number; cId: string } | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const {
    form,
    fields,
    replaceSamples,
    append,
    watchSamples,
    anyPointFailed
  } = useCSAForm();

  /** Explicit user navigation: wins over the automatic entry rules. */
  const openForm = useCallback((csaId: string | null = null) => {
    dispatch({ type: 'open-form', csaId });
  }, []);
  const selectCsa = useCallback((csaId: string | null) => {
    dispatch({ type: 'select', csaId });
  }, []);

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

  const csaKeys = csaKeysForYear(bpmProcessId, year);
  const { data: csaList, isLoading: isListLoading } = useQuery({
    queryKey: csaKeys.list,
    queryFn: () => {
      const params = new URLSearchParams();
      if (bpmProcessId) params.append('bpmProcessId', bpmProcessId);
      params.append('year', year);
      return api<{ items: CSARecord[] }>(`/api/csa?${params.toString()}`);
    },
    enabled: shouldFetchList(view, !!bpmProcessId)
  });

  const { data: linkedScheduleRecord, isLoading: isCheckingSchedule } = useQuery({
    queryKey: ['csa-record-by-schedule', scheduleId],
    queryFn: () => api<{ items: CSARecord[] }>(`/api/csa?scheduleId=${scheduleId}`).then(res => res.items[0]),
    enabled: !!scheduleId && !isInitialized && manualOverride !== 'list'
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

  const initializeFromSamples = useCallback((samples: readonly CsaInitialSample[]) => {
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

      return {
        sampleRef: s.glDesc ?? s.description ?? 'N/A',
        glRowId: s.id,
        controlResults,
      };
    });
    replaceSamples(newSamples);
    dispatch({ type: 'start-form' });
  }, [bpmRiskControlPairs, activeControls, replaceSamples]);

  // 2. Effects — the session reducer owns the state those effects used to chase.
  useEffect(() => {
    dispatch({ type: 'reset' });
    form.reset();
  }, [bpmProcessId, scheduleId, form]);

  useEffect(() => {
    // Nothing to show and the entry rules have had their turn: land on the list.
    if (isInitialized && initialSamples.length === 0 && !activeCsaId && manualOverride === null) {
      dispatch({ type: 'open-list' });
    }
  }, [initialSamples.length, isInitialized, activeCsaId, manualOverride]);

  useEffect(() => {
    if (
      shouldEnterForm({
        scheduleId: scheduleId ?? null,
        linkedRecordId: linkedScheduleRecord?.id ?? null,
        initialSamplesCount: initialSamples.length,
        override: manualOverride,
        isInitialized,
        isCheckingSchedule,
      })
    ) {
      if (linkedScheduleRecord) {
        dispatch({ type: 'start-form', csaId: linkedScheduleRecord.id });
      } else {
        initializeFromSamples(initialSamples);
      }
    }
  }, [scheduleId, linkedScheduleRecord, isCheckingSchedule, initialSamples, isInitialized, manualOverride, initializeFromSamples]);

  useEffect(() => {
    if (bpmProcess?.standardTestProcedure && !activeCsaId && !form.getValues('testProcedure')) {
      form.setValue('testProcedure', bpmProcess.standardTestProcedure);
    }
  }, [bpmProcess, activeCsaId, form]);

  useEffect(() => {
    if (activeCsa && activeCsaId && view !== 'list' && manualOverride !== 'list') {
      form.reset({
        period: activeCsa.period,
        result: activeCsa.result,
        comments: activeCsa.comments || '',
        testProcedure: activeCsa.testProcedure || '',
        archiveLocation: activeCsa.archiveLocation || '',
        samplingMethodology: activeCsa.samplingMethodology || '',
        documentList: activeCsa.documentList || '',
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
      dispatch({ type: 'start-form', csaId: activeCsaId });
    }
  }, [activeCsa, activeCsaId, view, manualOverride, form]);

  // 3. Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const url = activeCsaId ? `/api/csa/${activeCsaId}` : '/api/csa';
      const method = activeCsaId ? 'PUT' : 'POST';
      return api<CSARecord>(url, { method, body: JSON.stringify(data) });
    },
    onSuccess: (response, variables) => {
      toast.success(variables.isDraft ? t('assessment.draftSaved') : t('assessment.signOffSuccess'));
      void invalidateCsaYear(queryClient, bpmProcessId, year);
      
      if (resolvePostSaveView(!!variables.isDraft) === 'list') {
        dispatch({ type: 'open-list' });
      } else {
        const id = response.id || activeCsaId;
        if (id) dispatch({ type: 'select', csaId: id });
        form.reset(form.getValues(), { keepDirty: false });
      }
    },
    onError: (err: unknown) => {
      toast.error(
        t('assessment.saveFailed', {
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    },
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
      const path = `samples.${variables.sIdx}.controlResults.${variables.cId}.evidenceUrl` as FieldPath<CSAFormValues>;
      form.setValue(path, data.url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
      if (variables.meta) {
        const metaPath = `samples.${variables.sIdx}.controlResults.${variables.cId}.evidenceMeta` as FieldPath<CSAFormValues>;
        form.setValue(metaPath, variables.meta, { shouldDirty: true, shouldTouch: true });
      }
      toast.success(t('page.evidence.uploaded'));
      setActiveUploadRow(null);
    },
    onError: () => {
      toast.error(t('page.evidence.uploadError'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/csa/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(t('common:notifications.deleted'));
      void invalidateCsaYear(queryClient, bpmProcessId, year);
    },
    onError: (err: unknown) => {
      toast.error(
        t('assessment.deleteFailed', {
          defaultValue: 'Failed to delete the CSA assessment: {{message}}',
          message: err instanceof Error ? err.message : String(err),
        }),
      );
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
      organizationId: initialSamples[0]?.organizationId || searchParams.get('orgId'),
    });
  };

  const onSubmit = async (values: CSAFormValues) => {
    const check = checkSignOff(values);
    if (check.blocked && check.reason === 'missing-evidence') {
      toast.error(t('form.signOffMissingEvidence', { defaultValue: "Setiap kontrol yang 'Pass' wajib melampirkan bukti (evidence) sebelum sign-off." }));
      return;
    }
    const realResult = check.realResult;
    if (check.blocked && check.reason === 'failed-effective') {
       toast.error(t('form.signOffFailedEffective', { defaultValue: 'Tidak dapat sign-off sebagai Effective karena terdapat kontrol yang gagal.' }));
       return;
    }

    setIsAuthenticating(true);
    const verified = await promptBiometricAuth('authenticate');
    setIsAuthenticating(false);

    if (!verified) {
      toast.error(t('form.signOffAuthFailed', { defaultValue: 'Sign-off authentication failed' }));
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
      organizationId: initialSamples[0]?.organizationId || searchParams.get('orgId'),
    });
  };

  const handleBackToList = () => {
    dispatch({ type: 'open-list' });
    form.reset();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('history.deleteAssessment'),
      description: t('history.deleteConfirmDesc', { defaultValue: 'Hapus asesmen ini secara permanen? Data sampel dan bukti juga akan terhapus.' }),
      variant: 'destructive'
    });
    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  return {
    view,
    activeCsaId,
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
    openForm,
    selectCsa,
  };
}
