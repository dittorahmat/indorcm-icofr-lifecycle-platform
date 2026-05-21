import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ChevronRight, CheckCircle2, ShieldCheck, Zap, Loader2 as LucideLoader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnsavedChangesContext } from '@/context/UnsavedChangesContext';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { FileUploadZone } from './components/FileUploadZone';
import { StagingTable } from './components/StagingTable';
import { CrossCheckPanel } from './components/CrossCheckPanel';
import { IntelligenceDashboard } from './components/IntelligenceDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';

export function MigrationPage() {
    const { t } = useTranslation(['rcm', 'common', 'scoping']);
    const { setDirty, resetDirty } = useUnsavedChangesContext();
    const [isModified, setIsDirtyLocal] = useState(false);
    const [step, setStep] = useState(1); // 1: Ingestion, 2: Normalization, 3: Baselining
    const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString());

    // File States
    const [tbFile, setTbFile] = useState<File | null>(null);
    const [rcmFile, setRcmFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Mock Data for Staging (for demo purposes)
    const [stagingData, setStagingData] = useState<any[]>([]);

    // Sync dirty state
    useEffect(() => {
        setDirty(isModified);
        return () => resetDirty();
    }, [isModified, setDirty, resetDirty]);

    const handleProcessAI = async () => {
        if (!tbFile && !rcmFile) {
            toast.error("Please upload at least one file to process.");
            return;
        }

        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 3000));

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
    };

    const handleFinalize = async () => {
        toast.promise(
            (async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await api('/api/notifications', {
                    method: 'POST',
                    body: JSON.stringify({
                        message: t('rcm:migration.baselining.notification'),
                        type: 'success',
                        link: '/rcm'
                    })
                });
            })(),
            {
                loading: t('rcm:migration.baselining.processing'),
                success: t('rcm:migration.baselining.success'),
                error: t('common:notifications.error')
            }
        );
        resetDirty();
        setIsDirtyLocal(false);
        setStep(1);
        setTbFile(null);
        setRcmFile(null);
    };

    return (
        <AppLayout noScroll className="bg-slate-50/50">
            <div className="flex flex-col h-full">
                {/* Header Section - More Compact */}
                <div className="px-8 py-6 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                            {t('rcm:migration.title')}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium max-w-2xl">
                            {t('rcm:migration.description')}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1 min-w-[140px]">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Target Fiscal Year</span>
                            <Select value={fiscalYear} onValueChange={setFiscalYear}>
                                <SelectTrigger className="rounded-xl border border-slate-200 bg-white h-9 text-xs font-bold text-slate-700 shadow-sm">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {[2023, 2024, 2025, 2026, 2027].map(year => (
                                        <SelectItem key={year} value={year.toString()} className="text-xs">{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Stepper - Horizontal & Compact */}
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
            </div>
        </AppLayout>
    );
}

function ZapLoader({ className }: any) {
    return <Zap className={cn("animate-pulse text-amber-500", className)} />;
}
