import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

export interface StagingRow {
    id: string;
    level: 'ELC' | 'TLC' | 'ITGC';
    isValid: boolean;
    error?: string | null;
    entityCode?: string;
    processName?: string;
    subProcessName?: string;
    riskDescription?: string;
    controlCode: string;
    controlName: string;
    controlDescription: string;
    nature?: string;
    type?: string;
    frequency?: string;
    supportingApp?: string;
    cosoPrinciples?: number[];
    guessedFields?: string[];
    confidence?: Record<string, number>;
    accountCode?: string;
}

interface StagingTableProps {
    rows: StagingRow[];
    onUpdateRow: (id: string, field: string, value: any) => void;
}

export function StagingTable({ rows, onUpdateRow }: StagingTableProps) {
    const { t } = useTranslation(['rcm', 'common']);
    const rcmType = rows[0]?.level || 'TLC';

    const renderCell = (row: StagingRow, field: keyof StagingRow, label: string) => {
        const val = row[field];
        const isGuessed = row.guessedFields?.includes(field as string);
        const confidence = row.confidence?.[field as string] || 1.0;

        return (
            <TableCell className={cn(
                "relative group min-w-[150px] py-3",
                isGuessed && "bg-amber-50/20",
                !row.isValid && field === 'controlCode' && "bg-rose-50/30"
            )}>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-xs font-medium",
                        field === 'controlCode' ? "font-mono font-bold text-indigo-600" : "text-slate-600"
                    )}>
                        {Array.isArray(val) ? val.join(', ') : String(val || '-')}
                    </span>
                    {isGuessed && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">{t('rcm:migration.normalization.ai_suggestion', { confidence: (confidence * 100).toFixed(0) })}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </TableCell>
        );
    };

    return (
        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm max-w-full">
            <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-b-slate-200">
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 py-4">{t('rcm:matrix.company')}</TableHead>
                            {rcmType !== 'ELC' && <TableHead className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 py-4">Process / Sub</TableHead>}
                            {rcmType !== 'ELC' && <TableHead className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 py-4">Risk</TableHead>}
                            <TableHead className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 py-4">Control Ref / Name</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 py-4">Metadata</TableHead>
                            {rcmType === 'ELC' && <TableHead className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 py-4">COSO Principles</TableHead>}
                            {rcmType === 'ITGC' && <TableHead className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 py-4">App</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id} className={cn(
                                "hover:bg-slate-50/50 transition-colors border-b-slate-100",
                                !row.isValid && "bg-rose-50/10"
                            )}>
                                <TableCell className="text-center">
                                    {row.isValid ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                    ) : (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <XCircle className="h-4 w-4 text-rose-500 mx-auto" />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-rose-600 text-white border-none shadow-xl">
                                                    <p className="text-xs font-bold">{row.error || "Invalid Data"}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </TableCell>
                                <TableCell className="font-bold text-xs text-slate-900 uppercase">{row.entityCode || 'N/A'}</TableCell>
                                
                                {rcmType !== 'ELC' && (
                                    <TableCell className="max-w-[200px]">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-slate-800 truncate">{row.processName}</span>
                                            <span className="text-xs text-slate-500 truncate">{row.subProcessName}</span>
                                        </div>
                                    </TableCell>
                                )}

                                {rcmType !== 'ELC' && (
                                    <TableCell className="max-w-[250px]">
                                        <span className="text-xs text-slate-600 line-clamp-2 leading-tight">{row.riskDescription}</span>
                                    </TableCell>
                                )}

                                <TableCell className="max-w-[300px]">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-mono font-black text-indigo-600 uppercase tracking-tighter">{row.controlCode}</span>
                                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{row.controlName}</span>
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {row.type && <Badge variant="outline" className="text-xs h-4 uppercase px-1 border-slate-200">{row.type}</Badge>}
                                        {row.nature && <Badge variant="outline" className="text-xs h-4 uppercase px-1 border-slate-200">{row.nature}</Badge>}
                                        {row.frequency && <Badge variant="outline" className="text-xs h-4 uppercase px-1 border-slate-200 bg-slate-50">{row.frequency}</Badge>}
                                    </div>
                                </TableCell>

                                {rcmType === 'ELC' && (
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {row.cosoPrinciples?.map(p => (
                                                <Badge key={p} className="text-xs h-4 bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">{p}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                )}

                                {rcmType === 'ITGC' && (
                                    <TableCell>
                                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                                            <Info className="h-3 w-3" /> {row.supportingApp || 'Missing App'}
                                        </span>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
