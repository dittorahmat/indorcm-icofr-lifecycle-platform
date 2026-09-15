import React, { useState, useRef, useMemo } from 'react';
import { Appendix7aDetailed } from '../reports/Appendix7aDetailed';
import { Appendix7aSummary } from '../reports/Appendix7aSummary';
import { Control, GLRow, TransactionDetail } from '@shared/types';
import { useCSA } from '@/hooks/use-csa';
import { CSAList } from './CSAList';
import { CSAForm } from './CSAForm';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';

interface CSATabContentProps {
  noGL?: string;
  controls?: Control[];
  initialSamples?: (GLRow | TransactionDetail)[];
  bpmProcessId?: string;
  subProcessName?: string;
  standalone?: boolean;
  scheduleId?: string;
}

export function CSATabContent({ 
  noGL, 
  controls: propControls = [], 
  initialSamples = [],
  bpmProcessId,
  subProcessName,
  standalone = false,
  scheduleId
}: CSATabContentProps) {
  const { workingYear } = useFiscalYearStore();
  const {
    view, setView,
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
    manualViewOverride,
    setIsInitialized,
    activeCsaId,
    setActiveCsaId
  } = useCSA({ 
    bpmProcessId: bpmProcessId!, 
    scheduleId, 
    initialSamples, 
    controls: propControls 
  });

  const [printLayout, setPrintLayout] = useState<'detailed' | 'summary' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = form.formState.isDirty && view === 'form';
  useUnsavedChanges(isDirty);

  const handlePrint = (layout: 'detailed' | 'summary') => {
    setPrintLayout(layout);
    setTimeout(() => {
      window.print();
      setPrintLayout(null);
    }, 500);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadRow) {
      uploadMutation.mutate({ ...activeUploadRow, file });
    }
    e.target.value = '';
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
        <div className="flex-1 overflow-y-auto bg-white p-6 relative">
          {view === 'list' ? (
            <CSAList 
              items={csaList?.items || []}
              isLoading={isListLoading}
              onViewDetail={(id) => { manualViewOverride.current = 'form'; setActiveCsaId(id); setView('form'); }}
              onDelete={handleDelete}
              onPrint={(id, layout) => { setActiveCsaId(id); handlePrint(layout); }}
              onNewAssessment={() => {
                manualViewOverride.current = 'form';
                setIsInitialized(true); 
                setView('form'); 
                setActiveCsaId(null);
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
