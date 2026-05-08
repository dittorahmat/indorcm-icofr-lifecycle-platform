import React from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Loader2, Upload, AlertCircle, Table as TableIcon, FileText } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionUpload } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TransactionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  noGL: string;
  bpmProcessId?: string;
  onSuccess: () => void;
}

export function TransactionUploadModal({ isOpen, onClose, noGL, bpmProcessId, onSuccess }: TransactionUploadModalProps) {
  const { t, i18n } = useTranslation(['bpm', 'csa_hub', 'common']);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isReplaceMode, setIsReplaceMode] = React.useState(false);
  const locale = i18n.language === 'id' ? id : enUS;

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['transaction-uploads', noGL],
    queryFn: async () => {
      const res = await api<{ items: TransactionUpload[] }>(`/api/transaction-uploads?noGL=${noGL}`);
      return res.items || [];
    },
    enabled: isOpen
  });

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    const filename = file.name;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (json.length === 0) {
          toast.error("File kosong");
          setIsUploading(false);
          return;
        }

        // Direct Processing of Standardized Headers
        const rows = json.map(row => {
          let parsedDate: any = row.transDate;
          
          // Handle Excel Serial Dates (numbers)
          if (typeof row.transDate === 'number') {
            // Excel dates are days since Dec 30, 1899
            const date = new Date(Math.round((row.transDate - 25569) * 864e5));
            parsedDate = date.toISOString();
          } else if (row.transDate) {
            // Try to parse string
            const d = new Date(row.transDate);
            if (!isNaN(d.getTime())) {
              parsedDate = d.toISOString();
            }
          }

          return {
            noGL: String(row.noGL || noGL),
            transDate: parsedDate,
            refNo: String(row.refNo || ''),
            description: String(row.description || ''),
            amount: typeof row.amount === 'number' ? row.amount : parseFloat(String(row.amount || '0').replace(/,/g, '')),
            currency: row.currency || 'IDR',
            dcFlag: row.dcFlag || (parseFloat(String(row.amount)) < 0 ? 'C' : 'D'),
            bpmCode: typeof row.bpmCode !== 'undefined' ? String(row.bpmCode) : undefined,
          };
        });

        await api('/api/transaction-details', {
          method: 'POST',
          body: JSON.stringify({ 
            rows, 
            filename, 
            noGL, 
            bpmProcessId,
            mode: isReplaceMode ? 'replace' : 'append' 
          }),
        });

        toast.success(t('bpm:sampling.upload.success'));
        refetchHistory();
        onSuccess();
        onClose();
      } catch (err) {
        toast.error('Gagal mengunggah data. Pastikan format kolom sesuai.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [noGL, bpmProcessId, isReplaceMode, t, refetchHistory, onSuccess, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: isUploading
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <Tabs defaultValue="upload" className="w-full">
          <div className="px-6 pt-6 flex justify-between items-start">
            <div>
              <DialogTitle>{t('bpm:sampling.upload.title')}</DialogTitle>
              <DialogDescription className="mt-1">
                Account: <span className="font-bold text-indigo-600">{noGL}</span>
              </DialogDescription>
            </div>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="upload" className="text-xs font-bold uppercase tracking-tight">Upload Baru</TabsTrigger>
              <TabsTrigger value="history" className="text-xs font-bold uppercase tracking-tight">Riwayat</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="upload" className="m-0 border-none outline-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-indigo-900">Konfigurasi Unggah</p>
                      <p className="text-[10px] text-indigo-700">Format kolom wajib: transDate, refNo, description, amount, currency, dcFlag, noGL.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-indigo-200 shadow-sm">
                    <Label htmlFor="replace-mode" className="text-[10px] font-black uppercase text-slate-500 cursor-pointer">Ganti Data Lama</Label>
                    <Switch id="replace-mode" checked={isReplaceMode} onCheckedChange={setIsReplaceMode} />
                  </div>
                </div>

                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors relative",
                    isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                      <p className="text-sm font-bold text-slate-600">Sedang mengunggah data...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{t('bpm:sampling.upload.dropzone')}</p>
                        <p className="text-xs text-slate-400 mt-1">Excel (.xlsx, .xls) or CSV supported</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={onClose} disabled={isUploading}>
                  Batal
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0 border-none outline-none">
              <ScrollArea className="h-80 pr-4">
                {history.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic">
                    <TableIcon className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-xs">Belum ada riwayat unggahan untuk akun ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((h) => (
                      <div key={h.id} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors flex justify-between items-center group">
                        <div className="flex gap-3 items-start">
                          <div className="mt-1 h-8 w-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{h.filename}</p>
                            <div className="flex gap-2 items-center mt-1">
                              <Badge variant="outline" className="text-[9px] py-0 h-4">{h.rowCount} Baris</Badge>
                              <span className="text-[10px] text-slate-400">Oleh {h.uploadedBy}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-medium text-slate-500">
                            {formatDistanceToNow(new Date(h.createdAt), { addSuffix: true, locale })}
                          </p>
                          <span className="text-[9px] text-slate-300 group-hover:text-indigo-400 transition-colors">ID: {h.id.substring(0,8)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="flex justify-end mt-6">
                <Button variant="ghost" onClick={onClose}>Tutup</Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
