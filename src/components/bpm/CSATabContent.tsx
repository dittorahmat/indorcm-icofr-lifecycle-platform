import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Appendix7aDetailed } from '../reports/Appendix7aDetailed';
import { Appendix7aSummary } from '../reports/Appendix7aSummary';
import { Control, GLRow, TransactionDetail } from '@shared/types';
import { useCSA } from '@/hooks/use-csa';
import { CSAList } from './CSAList';
import { CSAForm } from './CSAForm';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import {
  csaAppendixFilename,
  csaDetailedColumns,
  csaSummaryColumns,
  mapCsaDetailedRows,
  mapCsaSummaryRows,
} from '@/lib/csa-excel-export';
import { formatCsaReference } from '@/lib/csa-utils';
import { requestFieldLocation } from '@/hooks/csa/use-field-location';

interface CSATabContentProps {
  noGL?: string;
  controls?: Control[];
  initialSamples?: (GLRow | TransactionDetail)[];
  bpmProcessId?: string;
  subProcessName?: string;
  standalone?: boolean;
  scheduleId?: string;
  fieldMode?: boolean;
}

export function CSATabContent({
  noGL,
  controls: propControls = [],
  initialSamples = [],
  bpmProcessId,
  subProcessName,
  standalone = false,
  scheduleId,
  fieldMode = false
}: CSATabContentProps) {
  const { workingYear } = useFiscalYearStore();
  const { t } = useTranslation(['csa_hub', 'common']);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const {
    view, openForm,
    activeCsa,
    csaList, isListLoading,
    bpmProcess,
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
    activeCsaId,
    selectCsa
  } = useCSA({ 
    bpmProcessId: bpmProcessId ?? '', 
    scheduleId, 
    initialSamples, 
    controls: propControls,
    year: workingYear
  });

  const [printLayout, setPrintLayout] = useState<'detailed' | 'summary' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<{ sIdx: number; cId: string; file: File } | null>(null);
  const [failedUpload, setFailedUpload] = useState<{ sIdx: number; cId: string; file: File } | null>(null);

  // Track upload outcome so a failed capture can be retried without losing the photo.
  useEffect(() => {
    if (uploadMutation.isSuccess) {
      pendingFileRef.current = null;
      setFailedUpload(null);
    } else if (uploadMutation.isError && pendingFileRef.current) {
      setFailedUpload(pendingFileRef.current);
    }
  }, [uploadMutation.isSuccess, uploadMutation.isError, uploadMutation.failureCount]);

  // Field mode (Lini 1 from agenda): skip History, land directly on the form.
  useEffect(() => {
    if (!fieldMode || view !== 'list' || isListLoading) return;
    openForm(null);
    form.reset({
      period: `${workingYear}-Q1`,
      result: 'Effective',
      comments: '',
      testProcedure: bpmProcess?.standardTestProcedure || '',
      archiveLocation: '',
      isBpmConfirmed: false,
      samples: []
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldMode, view, isListLoading]);

  const isDirty = form.formState.isDirty && view === 'form';
  useUnsavedChanges(isDirty);

  const handlePrint = (layout: 'detailed' | 'summary') => {
    setPrintLayout(layout);
    setTimeout(() => {
      window.print();
      setPrintLayout(null);
    }, 500);
  };

  const handleExcel = async (id: string, layout: 'detailed' | 'summary') => {
    const record = csaList?.items?.find((r) => r.id === id);
    if (!record || exportingId) return;
    setExportingId(id);
    try {
      const reference = formatCsaReference({
        bpmCode: bpmProcess?.bpmCode,
        noGL: noGL || bpmProcess?.noGL,
        bpmProcessId: record.bpmProcessId || bpmProcessId,
        year: workingYear || new Date(record.assessmentDate).getFullYear(),
        period: record.period,
      });
      const processName = subProcessName || bpmProcess?.name || 'N/A';
      const assessmentDate = new Date(record.assessmentDate).toISOString().split('T')[0];
      if (layout === 'detailed') {
        const rows = mapCsaDetailedRows(record, {
          passText: t('csa_hub:excel.pass', { defaultValue: 'Lolos' }),
          failText: t('csa_hub:excel.fail', { defaultValue: 'Gagal' }),
          hasEvidenceText: t('csa_hub:excel.hasEvidence', { defaultValue: 'Ada Bukti' }),
          noEvidenceText: t('csa_hub:excel.noEvidence', { defaultValue: 'Tanpa Bukti' }),
        });
        await exportRegulatoryTableToExcel(rows, {
          title: t('csa_hub:excel.detailedTitle', { defaultValue: 'LAMPIRAN 7A - RINCI' }),
          subtitle: processName,
          identityLines: [reference, record.period, assessmentDate],
          columns: csaDetailedColumns({
            no: t('csa_hub:excel.no', { defaultValue: 'No' }),
            sampleRef: t('csa_hub:excel.sampleRef', { defaultValue: 'Referensi Sampel / Transaksi' }),
            control: t('csa_hub:excel.control', { defaultValue: 'Kode & Nama Kontrol' }),
            result: t('csa_hub:excel.result', { defaultValue: 'Hasil' }),
            evidence: t('csa_hub:excel.evidence', { defaultValue: 'Bukti' }),
            passText: '',
            failText: '',
            hasEvidenceText: '',
            noEvidenceText: '',
          }),
          filename: csaAppendixFilename('detailed', reference, record.period),
          sheetName: t('csa_hub:excel.detailedTitle', { defaultValue: 'Lampiran 7A Rinci' }),
        });
      } else {
        const rows = mapCsaSummaryRows(record, {
          effectiveText: t('csa_hub:excel.effective', { defaultValue: 'EFEKTIF' }),
          ineffectiveText: t('csa_hub:excel.ineffective', { defaultValue: 'TIDAK EFEKTIF' }),
        });
        await exportRegulatoryTableToExcel(rows, {
          title: t('csa_hub:excel.summaryTitle', { defaultValue: 'LAMPIRAN 7A - RINGKAS' }),
          subtitle: processName,
          identityLines: [reference, record.period, assessmentDate],
          columns: csaSummaryColumns({
            no: t('csa_hub:excel.no', { defaultValue: 'No' }),
            control: t('csa_hub:excel.control', { defaultValue: 'Kode & Nama Kontrol' }),
            totalSamples: t('csa_hub:excel.totalSamples', { defaultValue: 'Total Sampel' }),
            pass: t('csa_hub:excel.pass', { defaultValue: 'Lolos' }),
            fail: t('csa_hub:excel.fail', { defaultValue: 'Gagal' }),
            status: t('csa_hub:excel.status', { defaultValue: 'Status' }),
            effectiveText: '',
            ineffectiveText: '',
          }),
          filename: csaAppendixFilename('summary', reference, record.period),
          sheetName: t('csa_hub:excel.summaryTitle', { defaultValue: 'Lampiran 7A Ringkas' }),
        });
      }
      toast.success(t('common:notifications.exportSuccess', { defaultValue: 'Excel berhasil diunduh' }));
    } catch (err: any) {
      toast.error(err?.message || t('common:notifications.exportFailed', { defaultValue: 'Gagal mengekspor Excel' }));
    } finally {
      setExportingId(null);
    }
  };

  const submitUploadFile = (target: { sIdx: number; cId: string }, file: File) => {
    pendingFileRef.current = { ...target, file };
    setFailedUpload(null);
    uploadMutation.reset();
    // GPS Fase-1: capture location in parallel, never block the upload.
    // The raw file is handed to useCSA's upload mutation, which compresses it
    // exactly once through the shared guarded `compressEvidenceImage`.
    const locationPromise = requestFieldLocation();
    void locationPromise.then((loc) => {
      uploadMutation.mutate({
        ...target,
        file,
        meta: { lat: loc.lat, lng: loc.lng, accuracyM: loc.accuracyM, capturedAt: loc.capturedAt, gpsStatus: loc.status },
      });
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadRow) {
      submitUploadFile(activeUploadRow, file);
    }
    e.target.value = '';
  };

  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadRow) {
      submitUploadFile(activeUploadRow, file);
    }
    e.target.value = '';
  };

  const onCameraUpload = (sIdx: number, cId: string) => {
    setActiveUploadRow({ sIdx, cId });
    cameraInputRef.current?.click();
  };

  const onRetryUpload = () => {
    if (failedUpload) {
      submitUploadFile({ sIdx: failedUpload.sIdx, cId: failedUpload.cId }, failedUpload.file);
    }
  };

  const getFileNameFromUrl = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const filenameParts = lastPart.split('-');
    if (filenameParts.length > 5) {
      return filenameParts.slice(5).join('-');
    }
    return lastPart;
  };

  const previewRecord = useMemo(() => {
    const values = form.getValues();
    return {
      ...activeCsa,
      ...values,
      id: activeCsaId || "PREVIEW-DRAFT",
      assessmentDate: activeCsa?.assessmentDate || Date.now(),
      assessedBy: activeCsa?.assessedBy || "Current User"
    } as any;
  }, [activeCsa, activeCsaId, form]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen { .printable-area { display: none; } }
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .print-hidden { display: none !important; }
        }
      `}} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        className="hidden" 
        accept=".pdf,.png,.jpg,.jpeg,.xlsx" 
      />

      <input
        type="file"
        ref={cameraInputRef}
        onChange={onCameraChange}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      <div className="printable-area">
        {printLayout === 'detailed' && (
          <Appendix7aDetailed 
            record={previewRecord} 
            bpmProcessName={subProcessName || bpmProcess?.name || "N/A"} 
            noGL={noGL || bpmProcess?.noGL || "N/A"} 
          />
        )}
        {printLayout === 'summary' && (
          <Appendix7aSummary 
            record={previewRecord} 
            bpmProcessName={subProcessName || bpmProcess?.name || "N/A"} 
            noGL={noGL || bpmProcess?.noGL || "N/A"} 
          />
        )}
      </div>

      <div className="flex-1 print-hidden h-full flex flex-col overflow-hidden">
        {fieldMode && (
          <div className="shrink-0 border-b border-indigo-100 bg-indigo-50/70 px-4 py-2.5 sm:px-6" data-testid="csa-field-task-banner">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 truncate">
              {subProcessName || bpmProcess?.name || t('csa_hub:form.summaryTitle', { defaultValue: 'CSA Assessment' })}
            </p>
            <p className="text-xs text-indigo-500 font-medium truncate">
              {formatCsaReference({ bpmCode: bpmProcess?.bpmCode, noGL: noGL || bpmProcess?.noGL, bpmProcessId, year: workingYear, period: form.watch('period') })}
            </p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-6 relative">
          {view === 'list' ? (
            <CSAList 
              items={csaList?.items || []}
              isLoading={isListLoading}
              onViewDetail={(id) => { openForm(id); }}
              onDelete={handleDelete}
              onPrint={(id, layout) => { selectCsa(id); handlePrint(layout); }}
              onExcel={handleExcel}
              exportingId={exportingId}
              onNewAssessment={() => {
                openForm(null);
                form.reset({
                   period: `${workingYear}-Q1`,
                   result: 'Effective',
                   comments: '',
                   testProcedure: bpmProcess?.standardTestProcedure || '',
                   archiveLocation: '',
                   isBpmConfirmed: false,
                   samples: []
                });
              }}
              bpmCode={bpmProcess?.bpmCode}
              noGL={noGL || bpmProcess?.noGL}
              bpmProcessId={bpmProcessId}
              year={workingYear}
            />
          ) : (
            <CSAForm 
              form={form}
              onSubmit={onSubmit}
              onSaveDraft={onSaveDraft}
              onBackToList={handleBackToList}
              onPrint={handlePrint}
              onFileUpload={(sIdx, cId) => { setActiveUploadRow({ sIdx, cId }); fileInputRef.current?.click(); }}
              onCameraUpload={onCameraUpload}
              failedUploadRow={failedUpload ? { sIdx: failedUpload.sIdx, cId: failedUpload.cId } : null}
              onRetryUpload={onRetryUpload}
              isReadOnly={isReadOnly}
              isAuthenticating={isAuthenticating}
              isPending={createMutation.isPending}
              activeControls={activeControls}
              bpmRiskControlPairs={bpmRiskControlPairs}
              watchSamples={watchSamples}
              fields={fields}
              append={append}
              anyPointFailed={anyPointFailed}
              activeUploadRow={activeUploadRow}
              getFileNameFromUrl={getFileNameFromUrl}
              bpmCode={bpmProcess?.bpmCode}
              noGL={noGL || bpmProcess?.noGL}
              bpmProcessId={bpmProcessId}
              year={workingYear}
              hideLine2Actions={fieldMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
