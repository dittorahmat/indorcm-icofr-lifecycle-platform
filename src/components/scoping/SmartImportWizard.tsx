import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
    ChevronRight, 
    ShieldCheck, 
    Zap, 
    Download,
    Loader2 as LucideLoader2,
    AlertCircle,
    Calculator,
    Search,
    Check,
    ChevronsUpDown
} from 'lucide-react';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";

import { parseGLFile, SheetCandidate } from '@/pages/scoping/services/gl-parser';
import { parseRCMFile, RCMType } from '@/pages/scoping/services/rcm-parser';
import { SheetSelectionModal } from '../import/SheetSelectionModal';
import { 
    getGroupMultiplier, 
    calculateOM, 
    calculatePM 
} from '@/pages/scoping/services/materiality-calc';

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
    const [rcmType, setRcmType] = useState<RCMType>('TLC');

    // File States
    const [tbFile, setTbFile] = useState<File | null>(null);
    const [rcmFile, setRcmFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Data States
    const [stagingData, setStagingData] = useState<any[]>([]);
    const [parsedTbData, setParsedTbData] = useState<any[]>([]);

    // Sheet Selection State
    const [sheetModalOpen, setSheetModalOpen] = useState(false);
    const [sheetCandidates, setSheetCandidates] = useState<SheetCandidate[]>([]);
    const [pendingTargetFile, setPendingTargetFile] = useState<File | null>(null);

    // Materiality States
    const [selectedBasis, setSelectedBasis] = useState<string>('');
    const [benchmarkPopoverOpen, setBenchmarkPopoverOpen] = useState(false);
    const [omPercentage, setOmPercentage] = useState<number>(5);
    const [haircutPercentage, setHaircutPercentage] = useState<number>(25);
    const [locationCount, setLocationCount] = useState<number>(1);

    // Aggregate FSLI candidates for benchmark selection
    const uniqueFsliData = React.useMemo(() => {
        if (!parsedTbData || parsedTbData.length === 0) return [];
        
        const fsliMap = new Map<string, { total: number, minNoUrut: number, explicitlyProvidedTotal: number | null }>();
        
        parsedTbData.forEach(r => {
            if (r.suggestedFsli) {
                const current = fsliMap.get(r.suggestedFsli) || { total: 0, minNoUrut: Infinity, explicitlyProvidedTotal: null };
                fsliMap.set(r.suggestedFsli, {
                    total: current.total + Math.abs(r.balance),
                    minNoUrut: Math.min(current.minNoUrut, r.noUrut ?? Infinity),
                    explicitlyProvidedTotal: r.fsliBalance !== undefined && r.fsliBalance !== null ? r.fsliBalance : current.explicitlyProvidedTotal
                });
            }
        });

        return Array.from(fsliMap.entries())
            .map(([name, data]) => ({ 
                name, 
                total: (data.explicitlyProvidedTotal !== null && data.explicitlyProvidedTotal !== 0) ? data.explicitlyProvidedTotal : data.total, 
                minNoUrut: data.minNoUrut === Infinity ? 999999 : data.minNoUrut 
            }))
            .sort((a, b) => {
                if (a.minNoUrut !== b.minNoUrut) {
                    return a.minNoUrut - b.minNoUrut;
                }
                return a.name.localeCompare(b.name);
            });
    }, [parsedTbData]);

    // Set default basis when data is loaded
    useEffect(() => {
        if (uniqueFsliData.length > 0 && !selectedBasis) {
            setSelectedBasis(uniqueFsliData[0].name);
        }
    }, [uniqueFsliData, selectedBasis]);

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

    const processTbWithSheet = async (file: File, targetSheet?: string) => {
        const tbResult = await parseGLFile(file, { targetSheet });
        if (tbResult.requiresSheetSelection && tbResult.sheets) {
            setPendingTargetFile(file);
            setSheetCandidates(tbResult.sheets);
            setSheetModalOpen(true);
            setIsProcessing(false);
            return false;
        }

        if (tbResult.success) {
            const tbDataForFinalize = tbResult.rows.map(r => ({
                accountCode: r.noGL,
                accountName: r.glDesc,
                balance: r.balance,
                fsliBalance: r.fsliBalance,
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
            return true;
        } else {
            toast.error(`TB Parse Error: ${tbResult.error}`);
            setIsProcessing(false);
            return false;
        }
    };

    const handleSheetSelected = async (sheetName: string) => {
        if (!pendingTargetFile) return;
        setIsProcessing(true);
        try {
            const ok = await processTbWithSheet(pendingTargetFile, sheetName);
            if (ok) {
                // If RCM file is also present and hasn't been parsed yet
                if (rcmFile && stagingData.length === 0) {
                    const rcmResult = await parseRCMFile(rcmFile, rcmType);
                    if (rcmResult.success) {
                        setStagingData(rcmResult.rows);
                    } else {
                        toast.error(`RCM Parse Error: ${rcmResult.error}`);
                        setIsProcessing(false);
                        return;
                    }
                }
                setIsProcessing(false);
                setIsDirtyLocal(true);
                setStep(2);
                toast.success("Extraction complete!");
            }
        } catch (err: any) {
            console.error("Sheet selection processing error:", err);
            toast.error("Processing failed: " + err.message);
            setIsProcessing(false);
        }
    };

    const handleProcessAI = async () => {
        if (!tbFile && !rcmFile) {
            toast.error("Please upload at least one file to process.");
            return;
        }

        setIsProcessing(true);
        
        try {
            // 1. Process TB if exists
            if (tbFile) {
                const tbSuccess = await processTbWithSheet(tbFile);
                if (!tbSuccess) {
                    // Modal opened or error shown
                    return;
                }
            }

            // 2. Process RCM if exists
            if (rcmFile) {
                const rcmResult = await parseRCMFile(rcmFile, rcmType);
                if (rcmResult.success) {
                    setStagingData(rcmResult.rows);
                } else {
                    toast.error(`RCM Parse Error: ${rcmResult.error}`);
                    setIsProcessing(false);
                    return;
                }
            }

            setIsProcessing(false);
            setIsDirtyLocal(true);
            setStep(2);
            toast.success("Extraction complete!");
        } catch (error: any) {
            console.error("AI Processing failed:", error);
            toast.error("Processing failed: " + error.message);
            setIsProcessing(false);
        }
    };

    const downloadTemplate = () => {
        const templates: Record<RCMType, string> = {
            TLC: "No;Informasi_Proses_Bisnis;Informasi_Sub_proses_Bisnis;Perusahaan_Pelaksana_Proses_Bisnis;Lokasi_Dilaksanakannya_Proses_Bisnis;Risiko_Aktivitas_Pengendalian;Risiko_Terkait_Fraud;Penilaian_Risiko;Referensi_Pengendalian;Nama_Aktivitas_Pengendalian;Deskripsi_Aktivitas_Pengendalian;Dokumen_Pendukung;Pengendalian_Utama;IPO_C;IPO_A;IPO_V;IPO_RA;Asersi_C;Asersi_A;Asersi_E_O;Asersi_CO;Asersi_R_O;Asersi_V_A;Asersi_PD;Preventif_Detektif;Sifat_Pelaksanaan_Pengendalian;Jenis_Pengendalian_Otomatis;Frekuensi_Pelaksanaan_Aktivitas;Aplikasi_Pendukung;Fungsi_Pelaksana_Aktivitas;Pelaku_Pengendalian;Item_Laporan_Keuangan_yang_Terdampak;Periode_Efektif",
            ELC: "Referensi_Pengendalian;Aktivitas_Pengendalian;Frekuensi_Pengendalian;Dokumen_Pengendalian;Fungsi_Pelaksana_Aktivitas_Pengendalian;Pelaku_Pengendalian;Periode_Efektif;Prinsip_COSO",
            ITGC: "No;Informasi_Proses_Bisnis;Informasi_Sub_proses_Bisnis;Perusahaan_Pelaksana_Proses_Bisnis;Lokasi_Dilaksanakannya_Proses_Bisnis;Risiko_Aktivitas_Pengendalian;Referensi_Pengendalian;Nama_Aktivitas_Pengendalian;Deskripsi_Aktivitas_Pengendalian;Dokumen_Pendukung;Pengendalian_Utama;Preventif_Detektif;Sifat_Pelaksanaan_Pengendalian;Jenis_Pengendalian_Otomatis;Frekuensi_Pelaksanaan_Aktivitas;Aplikasi_Pendukung;Fungsi_Pelaksana_Aktivitas;Pelaku_Pengendalian;Periode_Efektif"
        };
        const content = templates[rcmType];
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Template_RCM_${rcmType}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleFinalize = async () => {
        const invalidCount = stagingData.filter(r => !r.isValid).length;
        if (invalidCount > 0) {
            toast.error(t('rcm:migration.normalization.fix_errors_first', { count: invalidCount }));
            return;
        }

        const finalizePromise = (async () => {
            // Added slight delay for better UX as per previous pattern
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const benchmarkValue = uniqueFsliData.find(f => f.name === selectedBasis)?.total || 0;
            const omValue = calculateOM(benchmarkValue, omPercentage, getGroupMultiplier(locationCount));
            const pmValue = calculatePM(omValue, haircutPercentage);

            // Call real backend API to finalize migration
            await api('/api/migration/finalize', {
                method: 'POST',
                body: JSON.stringify({ 
                    year: fiscalYear,
                    rcmData: stagingData,
                    tbData: parsedTbData,
                    tbFileName: tbFile?.name,
                    simulationParams: parsedTbData.length > 0 ? {
                        basis: selectedBasis,
                        omPercentage,
                        haircutPercentage,
                        locationCount,
                        omValue,
                        pmValue
                    } : null
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
                <DialogHeader className="px-8 py-6 bg-mancity-pattern text-primary-foreground flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-primary-foreground">
                            <Zap className="h-6 w-6 text-primary-foreground" />
                            {t('rcm:migration.title')}
                        </DialogTitle>
                        <p className="text-xs text-primary-foreground/60 font-medium">{t('rcm:migration.description')}</p>
                    </div>
                    <div className="flex items-center gap-6 mr-8">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black text-primary-foreground/60 uppercase tracking-widest">Import for Cycle</span>
                            <span className="text-xs font-bold text-primary-foreground">{fiscalYear}</span>
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
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Pilih Tipe RCM</h4>
                                                    <Button variant="outline" size="sm" onClick={downloadTemplate} className="h-7 text-[9px] font-bold gap-2 uppercase tracking-widest rounded-full">
                                                        <Download className="h-3 w-3" /> Template {rcmType}
                                                    </Button>
                                                </div>
                                                <RadioGroup value={rcmType} onValueChange={(v) => setRcmType(v as RCMType)} className="flex gap-6">
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="TLC" id="tlc" />
                                                        <Label htmlFor="tlc" className="text-xs font-bold text-slate-700">TLC (Transactional)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="ELC" id="elc" />
                                                        <Label htmlFor="elc" className="text-xs font-bold text-slate-700">ELC (Entity Level)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="ITGC" id="itgc" />
                                                        <Label htmlFor="itgc" className="text-xs font-bold text-slate-700">ITGC (IT General)</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>

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
                                                <Button onClick={() => setStep(3)} className="rounded-xl px-10 h-11 font-black uppercase tracking-widest bg-mancity-pattern text-primary-foreground hover:opacity-90 shadow-lg text-[10px]">Next: View Summary</Button>
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

                                            {parsedTbData.length > 0 && (
                                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                                            <Calculator className="h-5 w-5 text-indigo-600" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Materiality Configuration</h4>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Set baseline parameters for quantitative scoping</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('scoping:form.benchmark')}</Label>
                                                                <Popover open={benchmarkPopoverOpen} onOpenChange={setBenchmarkPopoverOpen}>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            aria-expanded={benchmarkPopoverOpen}
                                                                            className="w-full h-12 justify-between rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-700 hover:bg-slate-100 px-4"
                                                                        >
                                                                            {selectedBasis ? (
                                                                                <div className="flex items-center justify-between w-full pr-2 text-left truncate">
                                                                                    <span className="truncate">{selectedBasis}</span>
                                                                                    <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                                                                                        Rp {(uniqueFsliData.find(f => f.name === selectedBasis)?.total || 0).toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-slate-400 font-normal">Select Benchmark Basis</span>
                                                                            )}
                                                                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-[420px] p-0 rounded-2xl border-slate-200 shadow-xl overflow-hidden" align="start">
                                                                        <Command>
                                                                            <CommandInput placeholder="Cari FSLI / GL Benchmark..." className="h-10 text-xs" />
                                                                            <CommandList className="max-h-60 overflow-y-auto">
                                                                                <CommandEmpty className="py-4 text-center text-xs text-slate-400">
                                                                                    FSLI tidak ditemukan.
                                                                                </CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {uniqueFsliData.map((item) => (
                                                                                        <CommandItem
                                                                                            key={item.name}
                                                                                            value={item.name}
                                                                                            onSelect={(currentValue) => {
                                                                                                setSelectedBasis(item.name);
                                                                                                setBenchmarkPopoverOpen(false);
                                                                                            }}
                                                                                            className="flex items-center justify-between py-2.5 px-3 cursor-pointer text-xs font-bold text-slate-700 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-900"
                                                                                        >
                                                                                            <div className="flex items-center gap-2 truncate">
                                                                                                <Check
                                                                                                    className={cn(
                                                                                                        "h-4 w-4 shrink-0 text-indigo-600",
                                                                                                        selectedBasis === item.name ? "opacity-100" : "opacity-0"
                                                                                                    )}
                                                                                                />
                                                                                                <span className="truncate">{item.name}</span>
                                                                                            </div>
                                                                                            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-4">
                                                                                                Rp {item.total.toLocaleString()}
                                                                                            </span>
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Overall Materiality %</Label>
                                                                    <div className="relative">
                                                                        <Input 
                                                                            type="number" step="0.1" value={omPercentage} 
                                                                            onChange={e => setOmPercentage(parseFloat(e.target.value) || 0)}
                                                                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-black text-indigo-600 pr-8"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Haircut %</Label>
                                                                    <div className="relative">
                                                                        <Input 
                                                                            type="number" step="0.1" value={haircutPercentage} 
                                                                            onChange={e => setHaircutPercentage(parseFloat(e.target.value) || 0)}
                                                                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-black text-amber-600 pr-8"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-mancity-pattern rounded-[2rem] p-6 text-primary-foreground space-y-6 flex flex-col justify-center border-4 border-white/20 shadow-2xl relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                                                <Calculator className="h-32 w-32 -rotate-12" />
                                                            </div>
                                                            <div className="space-y-4 relative z-10">
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Calculated OM</p>
                                                                    <p className="text-2xl font-mono font-black tracking-tighter">
                                                                        Rp {calculateOM(uniqueFsliData.find(f => f.name === selectedBasis)?.total || 0, omPercentage, getGroupMultiplier(locationCount)).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <div className="h-px bg-slate-800" />
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">Performance Materiality (PM)</p>
                                                                    <p className="text-2xl font-mono font-black tracking-tighter text-amber-50">
                                                                        Rp {calculatePM(calculateOM(uniqueFsliData.find(f => f.name === selectedBasis)?.total || 0, omPercentage, getGroupMultiplier(locationCount)), haircutPercentage).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest relative z-10">
                                                                <AlertCircle className="h-3 w-3" />
                                                                Based on {getGroupMultiplier(locationCount)}x Group Multiplier
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

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

            <SheetSelectionModal
                isOpen={sheetModalOpen}
                onOpenChange={setSheetModalOpen}
                fileName={pendingTargetFile?.name || tbFile?.name || ''}
                sheets={sheetCandidates}
                onSelectSheet={handleSheetSelected}
            />
        </Dialog>
    );
}

function ZapLoader({ className }: any) {
    return <Zap className={cn("animate-pulse text-amber-500", className)} />;
}
