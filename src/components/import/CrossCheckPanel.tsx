import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CrossCheckItem {
    accountCode: string;
    accountName: string;
    balance: number;
    status: 'Covered' | 'Unmitigated' | 'QualitativeCandidate';
    linkedControls: number;
}

interface CrossCheckPanelProps {
    items: CrossCheckItem[];
}

export function CrossCheckPanel({ items }: CrossCheckPanelProps) {
    const { t } = useTranslation(['rcm', 'scoping', 'common']);

    return (
        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-slate-50/50">
            <CardHeader className="border-b bg-white/50 py-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {t('rcm:migration.normalization.cross_check_title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-white transition-colors group">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-400">{item.accountCode}</span>
                                    <span className="text-sm font-bold text-slate-900">{item.accountName}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                    {t('scoping:table.balance')}: {item.balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end gap-1">
                                    {item.status === 'Covered' && (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 shadow-none">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> {item.linkedControls} {t('rcm:matrix.controls')}
                                        </Badge>
                                    )}
                                    {item.status === 'Unmitigated' && (
                                        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 shadow-none">
                                            <AlertTriangle className="h-3 w-3 mr-1" /> {t('rcm:migration.normalization.unmitigated')}
                                        </Badge>
                                    )}
                                    {item.status === 'QualitativeCandidate' && (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 shadow-none">
                                            <HelpCircle className="h-3 w-3 mr-1" /> {t('rcm:migration.normalization.qual_candidate')}
                                        </Badge>
                                    )}
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
