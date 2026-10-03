import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, ShieldAlert, History, FileCheck, Target, ArrowUpRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface IntelligenceDashboardProps {
    summary: {
        totalEntities: number;
        processesCreated: number;
        risksMapped: number;
        controlsIdentified: number;
        confidenceScore: number;
        unmitigatedRisks: number;
    }
}

export function IntelligenceDashboard({ summary }: IntelligenceDashboardProps) {
    const { t } = useTranslation(['rcm', 'common']);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Stats */}
            <Card className="col-span-2 border-slate-200 shadow-xl rounded-lg overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b py-4 sm:py-6 px-4 sm:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <History className="h-4 w-4" /> {t('rcm:migration.intelligence.title')}
                        </CardTitle>
                        <div className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase w-fit">
                            {t('rcm:migration.intelligence.analysis_complete')}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-slate-900">{summary.totalEntities}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('rcm:migration.intelligence.subsidiaries')}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-indigo-600">{summary.processesCreated}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('rcm:migration.intelligence.processes')}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-emerald-600">{summary.risksMapped}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('rcm:migration.intelligence.risks')}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-slate-900">{summary.controlsIdentified}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('rcm:migration.intelligence.controls')}</div>
                    </div>
                </CardContent>
            </Card>

            {/* Confidence & Risks */}
            <div className="flex flex-col gap-6">
                <Card className="border-slate-200 shadow-lg rounded-lg bg-indigo-600 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Target className="h-24 w-24" />
                    </div>
                    <CardContent className="p-4 sm:p-8 space-y-4">
                        <div className="text-xs font-black uppercase tracking-widest opacity-80">{t('rcm:migration.intelligence.confidence_label')}</div>
                        <div className="text-4xl font-black">{(summary.confidenceScore * 100).toFixed(1)}%</div>
                        <Progress value={summary.confidenceScore * 100} className="h-2 bg-indigo-400" />
                        <p className="text-xs opacity-70 leading-relaxed">
                            {t('rcm:migration.description')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-red-100 shadow-lg rounded-lg bg-red-50 overflow-hidden relative">
                    <CardContent className="p-4 sm:p-8 flex items-center justify-between flex-wrap gap-2">
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-red-600">{summary.unmitigatedRisks}</div>
                            <div className="text-xs font-black text-red-400 uppercase tracking-widest">{t('rcm:migration.intelligence.unmitigated_label')}</div>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
