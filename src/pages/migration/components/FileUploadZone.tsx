import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, ShieldCheck, X, FileIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadZoneProps {
    type: 'TB' | 'RCM';
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    isProcessing?: boolean;
}

export function FileUploadZone({ type, onFileSelect, selectedFile, isProcessing }: FileUploadZoneProps) {
    const { t } = useTranslation(['rcm', 'common']);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
            onFileSelect(file);
        }
    };

    const validateFile = (file: File) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload .xlsx or .csv");
            return false;
        }
        return true;
    };

    return (
        <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
                "relative border-2 border-dashed rounded-[2rem] flex flex-col items-center text-center gap-4 transition-all group",
                selectedFile ? "p-8 border-solid bg-slate-50/50" : "p-12 border-dashed",
                isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30",
                selectedFile && "border-indigo-500",
                type === 'RCM' && !isDragging && "hover:border-emerald-300 hover:bg-emerald-50/30",
                type === 'RCM' && selectedFile && "border-emerald-500"
            )}
        >
            {isProcessing && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-[2rem] flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                    <span className="font-bold text-xs text-indigo-900 uppercase tracking-widest">{t('rcm:migration.normalization.ai_thinking')}</span>
                </div>
            )}

            <div className={cn(
                "h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors",
                selectedFile && "bg-white text-indigo-600",
                type === 'RCM' && selectedFile && "text-emerald-600"
            )}>
                {type === 'TB' ? <Upload className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
            </div>

            {selectedFile ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <FileIcon className="h-4 w-4 text-indigo-500" />
                        {selectedFile.name}
                    </div>
                    <p className="text-xs text-slate-500">{t('rcm:migration.ingestion.ai_ready')}</p>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onFileSelect(null as any); }}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1 mx-auto mt-2"
                    >
                        <X className="h-3 w-3" /> {t('common:actions.delete')}
                    </button>
                </div>
            ) : (
                <div className="space-y-1">
                    <h3 className="font-bold text-slate-900">
                        {type === 'TB' ? t('rcm:migration.ingestion.upload_tb') : t('rcm:migration.ingestion.upload_rcm')}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {type === 'TB' ? t('rcm:migration.ingestion.upload_tb_desc') : t('rcm:migration.ingestion.upload_rcm_desc')}
                    </p>
                    <Badge variant="outline" className="mt-4 bg-white">
                        {type === 'TB' ? 'Supports .xlsx, .csv' : t('rcm:migration.ingestion.upload_rcm_desc')}
                    </Badge>
                </div>
            )}
            
            <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validateFile(file)) onFileSelect(file);
                }}
            />
        </div>
    );
}
