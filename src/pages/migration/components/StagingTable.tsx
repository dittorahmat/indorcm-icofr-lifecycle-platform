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
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface StagingRow {
    id: string;
    entityCode: string;
    processName: string;
    riskDescription: string;
    controlDescription: string;
    nature: string;
    type: string;
    frequency: string;
    guessedFields: string[]; // List of fields guessed by AI
    confidence: Record<string, number>;
}

interface StagingTableProps {
    rows: StagingRow[];
    onUpdateRow: (id: string, field: string, value: any) => void;
}

export function StagingTable({ rows, onUpdateRow }: StagingTableProps) {
    const { t } = useTranslation(['rcm', 'common']);

    const renderCell = (row: StagingRow, field: keyof StagingRow, label: string) => {
        const isGuessed = row.guessedFields.includes(field as string);
        const confidence = row.confidence[field as string] || 1.0;

        return (
            <TableCell className={cn(
                "relative group min-w-[150px]",
                isGuessed && "bg-amber-50/50"
            )}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700">
                        {row[field] as string}
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
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">{t('rcm:matrix.company')}</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">{t('rcm:matrix.process_info')}</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">{t('rcm:matrix.risk_description')}</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">{t('rcm:matrix.control_description')}</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">{t('rcm:matrix.nature')}</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">{t('rcm:matrix.type')}</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500">{t('rcm:matrix.frequency')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-mono text-[10px] text-slate-400">{row.entityCode}</TableCell>
                            {renderCell(row, 'processName', t('rcm:matrix.process_info'))}
                            {renderCell(row, 'riskDescription', t('rcm:matrix.risk_description'))}
                            {renderCell(row, 'controlDescription', t('rcm:matrix.control_description'))}
                            {renderCell(row, 'nature', t('rcm:matrix.nature'))}
                            {renderCell(row, 'type', t('rcm:matrix.type'))}
                            {renderCell(row, 'frequency', t('rcm:matrix.frequency'))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
