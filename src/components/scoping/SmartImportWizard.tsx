import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ShieldCheck, Zap, Loader2 as LucideLoader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { FileUploadZone } from '../import/FileUploadZone';
import { StagingTable } from '../import/StagingTable';
import { CrossCheckPanel } from '../import/CrossCheckPanel';
import { IntelligenceDashboard } from '../import/IntelligenceDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { parseGLFile } from '@/pages/scoping/services/gl-parser';

interface SmartImportWizardProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function SmartImportWizard({ isOpen, onOpenChange, onSuccess }: SmartImportWizardProps) {
    const { t } = useTranslation(['rcm', 'common', 'scoping']);
    const { setDirty, resetDirty } = useUnsavedChangesContext();
    const { workingYear } = useFiscalYearStore();
    const [isModified, setIsDirtyLocal] = useState(false);
    const [step, setStep] = useState(1); // 1: Ingestion, 2: Normalization, 3: Baselining
    const [fiscalYear, setFiscalYear] = useState(workingYear);

    // File States
    const [tbFile, setTbFile] = useState<File | null>(null);
    const [rcmFile, setRcmFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Data States
    const [stagingData, setStagingData] = useState<any[]>([]);
    const [parsedTbData, setParsedTbData] = useState<any[]>([]);

    // Sync local state with global store
    useEffect(() => {
        setFiscalYear(workingYear);
    }, [workingYear]);

    // Sync dirty state
    useEffect(() => {
        if (isOpen) {
            setDirty(isModified);
        }
        return () => {
            if (!isOpen) resetDirty();
        };
    }, [isModified, setDirty, resetDirty, isOpen]);

    const handleProcessAI = async () => {
        if (!tbFile && !rcmFile) {
            toast.error("Please upload at least one file to process.");
            return;
        }

        setIsProcessing(true);
        
        try {
            // 1. Process TB if exists
            if (tbFile) {
                const tbResult = await parseGLFile(tbFile);
                if (tbResult.success) {
                    // Map GLRow format to what finalize expects
                    const tbDataForFinalize = tbResult.rows.map(r => ({
                        accountCode: r.noGL,
                        accountName: r.glDesc,
                        balance: r.balance,
                        entityCode: r.entityCode,
                        parentEntityCode: r.parentEntityCode,
                        suggestedFsli: r.fsliName,
                        confidence: r.mappingConfidence,
                        noUrut: r.noUrut,
                        currency: r.currency,
                        ymd: r.ymd,
                        category: r.category,
                        subKategori: r.subKategori,
                        fsliCode: r.fsliCode
                    }));
                    setParsedTbData(tbDataForFinalize);
                } else {
                    toast.error(`TB Parse Error: ${tbResult.error}`);
                    setIsProcessing(false);
                    return;
                }
            }

            // 2. Process RCM (Mock for now, but real parsing could be added)
            await new Promise(resolve => setTimeout(resolve, 1500));

            setStagingData([
                {
                    id: '1',
                    entityCode: 'BSN-01',
                    processName: 'Pengadaan Barang & Jasa',
                    riskDescription: 'Vendor fiktif atau mark-up harga',
                    controlDescription: 'Manajer menyetujui nota pembelian dan membandingkan dengan 3 vendor',
                    nature: 'Manual',
                    type: 'Preventive',
                    frequency: 'Ad-hoc',
                    guessedFields: ['type', 'nature'],
                    confidence: { type: 0.95, nature: 0.92 }
                },
                {
                    id: '2',
                    entityCode: 'BSN-01',
                    processName: 'Pengadaan Barang & Jasa',
                    riskDescription: 'Pembayaran ganda',
                    controlDescription: 'Rekonsiliasi invoice dengan bukti bayar setiap akhir bulan',
                    nature: 'Manual',
                    type: 'Detective',
                    frequency: 'Monthly',
                    guessedFields: ['type'],
                    confidence: { type: 0.88 }
                }
            ]);

            setIsProcessing(false);
            setIsDirtyLocal(true);
            setStep(2);
            toast.success("AI extraction complete!");
        } catch (error: any) {
            console.error("AI Processing failed:", error);
            toast.error("Processing failed: " + error.message);
            setIsProcessing(false);
        }
    };

    const handleFinalize = async () => {
        const finalizePromise = (async () => {
            // Added slight delay for better UX as per previous pattern
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Call real backend API to finalize migration
            await api('/api/migration/finalize', {
                method: 'POST',
                body: JSON.stringify({ 
                    year: fiscalYear,
                    rcmData: stagingData,
                    tbData: parsedTbData
                })
            });

            await api('/api/notifications', {
                method: 'POST',
                body: JSON.stringify({
                    message: t('rcm:migration.baselining.notification'),
                    type: 'success',
                    link: '/rcm'
                })
            });
        })();

        toast.promise(finalizePromise, {
            loading: t('rcm:migration.baselining.processing'),
            success: t('rcm:migration.baselining.success'),
            error: t('common:notifications.error')
        });

        try {
            await finalizePromise;
            resetDirty();
            setIsDirtyLocal(false);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Finalize failed:", err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && isModified) {
                if (window.confirm(t('common:unsavedChanges.description'))) {
                    onOpenChange(false);
                    setIsDirtyLocal(false);
                    setStep(1);
                    setTbFile(null);
                    setRcmFile(null);
                }
            } else {
                onOpenChange(open);
                if (!open) {
                    setStep(1);
                    setTbFile(null);
                    setRcmFile(null);
                }
            }
        }}>
            <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
                <DialogHeader className="px-8 py-6 bg-slate-900 text-white flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Zap className="h-6 w-6 text-indigo-400" />
                            {t('rcm:migration.title')}
                        </DialogTitle>
                        <p className="text-xs text-slate-400 font-medium">{t('rcm:migration.description')}</p>
                    </div>
                    <div className="flex items-center gap-6 mr-8">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Import for Cycle</span>
                            <span className="text-xs font-bold text-indigo-300">{fiscalYear}</span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                         {/* Stepper */}
                        <div className="flex items-center justify-center gap-8 py-2">
                            {[1, 2, 3].map((s) => (
                                <React.Fragment key={s}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
                                            step >= s ? "bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-110" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {s}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                                            step >= s ? "text-indigo-900" : "text-slate-400"
                                        )}>
                                            {s === 1 ? t('rcm:migration.steps.ingestion') : s === 2 ? t('rcm:migration.steps.normalization') : t('rcm:migration.steps.baselining')}
                                        </span>
                                    </div>
                                    {s < 3 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                                </React.Fragment>
                            ))}
                        </div>

                        <Card className="border-slate-200 shadow-xl overflow-hidden rounded-[2.5rem] bg-white">
                            <CardContent className="p-8">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="space-y-8"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FileUploadZone 
                                                    type="TB" onFileSelect={(file) => { setTbFile(file); setIsDirtyLocal(true); }} 
                                                    selectedFile={tbFile} isProcessing={isProcessing}
                                                />
                                                <FileUploadZone 
                                                    type="RCM" onFileSelect={(file) => { setRcmFile(file); setIsDirtyLocal(true); }} 
                                                    selectedFile={rcmFile} isProcessing={isProcessing}
                                                />
                                            </div>

                                            <div className={cn(
                                                "pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-500",
                                                (tbFile || rcmFile) ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2 pointer-events-none"
                                            )}>
                                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-200">
                                                    <Zap className={cn("h-3.5 w-3.5", (tbFile || rcmFile) ? "text-amber-500 fill-amber-500 animate-pulse" : "text-slate-300")} />
                                                    {(tbFile || rcmFile) ? t('rcm:migration.ingestion.ai_ready') : "Upload files to begin AI analysis"}
                                                </div>
                                                <Button 
                                                    size="lg" 
                                                    className="rounded-2xl px-12 font-black uppercase tracking-[0.15em] gap-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl h-14 text-xs transition-all active:scale-95"
                                                    onClick={handleProcessAI}
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? <ZapLoader className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                                    {t('rcm:migration.ingestion.process_btn')}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                                <div className="lg:col-span-1"><CrossCheckPanel items={[
                                                    { accountCode: '1110.01', accountName: 'Kas Kecil', balance: 25000000, status: 'Covered', linkedControls: 1 },
                                                    { accountCode: '1210.01', accountName: 'Piutang PLN', balance: 15000000000, status: 'Unmitigated', linkedControls: 0 },
                                                    { accountCode: '4110.01', accountName: 'Pendapatan', balance: 75000000000, status: 'Unmitigated', linkedControls: 0 },
                                                ]} /></div>
                                                <div className="lg:col-span-3">
                                                    <StagingTable rows={stagingData} onUpdateRow={(id, field, val) => {
                                                        setStagingData(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
                                                    }} />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Back to Upload</Button>
                                                <Button onClick={() => setStep(3)} className="rounded-xl px-10 h-11 font-black uppercase tracking-widest bg-slate-900 text-white shadow-lg text-[10px]">Next: View Summary</Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                                            className="space-y-8"
                                        >
                                            <IntelligenceDashboard summary={{
                                                totalEntities: 2, processesCreated: 3, risksMapped: 5,
                                                controlsIdentified: stagingData.length, confidenceScore: 0.91, unmitigatedRisks: 2
                                            }} />
                                            <div className="flex flex-col items-center justify-center py-10 text-center gap-6 bg-indigo-50/30 rounded-[3rem] border-2 border-dashed border-indigo-100">
                                                <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg"><ShieldCheck className="h-8 w-8" /></div>
                                                <div className="space-y-1"><h2 className="text-xl font-black text-slate-900 uppercase">{t('rcm:migration.baselining.ready_title')}</h2><p className="text-xs text-slate-500 max-w-sm mx-auto">{t('rcm:migration.baselining.ready_desc')}</p></div>
                                                <div className="flex gap-4"><Button variant="ghost" onClick={() => setStep(2)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Mapping</Button><Button size="lg" onClick={handleFinalize} className="rounded-2xl px-12 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-xl text-white h-14 text-xs">Finalize Baseline</Button></div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ZapLoader({ className }: any) {
    return <Zap className={cn("animate-pulse text-amber-500", className)} />;
}
