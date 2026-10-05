import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useConfirm } from '@/hooks/use-confirm';
import type { ApplicationDocument, ITGCArea } from '@shared/types';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';

interface ITGCEvidenceLibraryProps {
  applicationId: string;
  itgcArea: ITGCArea;
  domainTitle: string;
  domainDescription: string;
  onPreviewFile: (file: { url: string; name: string; type: string }) => void;
}

export function ITGCEvidenceLibrary({
  applicationId,
  itgcArea,
  domainTitle,
  domainDescription,
  onPreviewFile,
}: ITGCEvidenceLibraryProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch documents for this application & ITGC Area
  const { data: docsData, isLoading } = useQuery({
    queryKey: ['application-documents', applicationId, itgcArea],
    queryFn: () =>
      api<{ items: ApplicationDocument[] }>(
        `/api/applications/${applicationId}/documents?itgcArea=${encodeURIComponent(itgcArea)}`
      ),
    enabled: !!applicationId,
  });

  const documents = docsData?.items || [];

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('itgcArea', itgcArea);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const res = await fetch(`/api/applications/${applicationId}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-documents', applicationId, itgcArea] });
      toast.success(t('rcm:application_detail.doc_uploaded'));
      setNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload document');
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) =>
      api(`/api/applications/${applicationId}/documents/${docId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-documents', applicationId, itgcArea] });
      toast.success(t('rcm:application_detail.doc_deleted'));
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete document');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25MB limit');
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string, mimeType?: string | null) => {
    const name = fileName.toLowerCase();
    if (name.endsWith('.pdf') || mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    if (name.match(/\.(xlsx?|csv)$/) || mimeType?.includes('sheet') || mimeType?.includes('excel')) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
    }
    if (name.match(/\.(png|jpe?g|webp|svg|gif)$/) || mimeType?.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-purple-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-5">
      {/* Domain Description Banner */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap min-w-0 max-w-full">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            {domainTitle} ({itgcArea})
          </h4>
          <p className="text-xs text-slate-500 max-w-2xl">{domainDescription}</p>
        </div>

        {/* Upload Action */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"
          />
          <div className="flex items-center gap-2">
            <Input
              placeholder={t('rcm:application_detail.notes', { defaultValue: 'Notes (e.g. Q3 2025 Audit Evidence)' })}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs w-52 bg-white"
            />
            <Button
              type="button"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
            >
              {isUploading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>{isUploading ? t('rcm:application_detail.uploading') : t('rcm:application_detail.upload_btn')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
          <span>Loading evidence documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg space-y-2">
          <Upload className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-600">{t('rcm:application_detail.no_documents')}</p>
          <p className="text-xs text-slate-400">{t('rcm:application_detail.drop_file_hint')}</p>
        </div>
      ) : (
        <>
        <div className="md:hidden mb-3">
          <MobileDesktopBanner recordCount={documents.length} />
        </div>
        <div className="border border-slate-200 rounded-lg overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-700">{t('rcm:application_detail.file_name')}</TableHead>
                <TableHead className="w-[100px] text-xs font-bold text-slate-700">{t('rcm:application_detail.file_size')}</TableHead>
                <TableHead className="w-[150px] text-xs font-bold text-slate-700">{t('rcm:application_detail.uploader')}</TableHead>
                <TableHead className="w-[160px] text-xs font-bold text-slate-700">{t('rcm:application_detail.upload_date')}</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">{t('rcm:application_detail.notes')}</TableHead>
                <TableHead className="w-[130px] text-right text-xs font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-medium text-xs text-slate-800">
                    <div className="flex items-center gap-2 max-w-[280px]">
                      {getFileIcon(doc.fileName, doc.mimeType)}
                      <span className="truncate" title={doc.fileName}>{doc.fileName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    {doc.uploadedByName || 'User'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd MMM yyyy, HH:mm') : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                    {doc.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        title={t('rcm:application_detail.preview')}
                        onClick={() =>
                          onPreviewFile({
                            url: doc.fileUrl,
                            name: doc.fileName,
                            type: doc.mimeType || '',
                          })
                        }
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title={t('rcm:application_detail.download')}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-[44px] min-w-[44px] p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title={t('rcm:application_detail.delete')}
                        onClick={async () => {
                          const ok = await confirm({
                            title: t('common:actions.delete'),
                            description: t('rcm:application_detail.delete_doc_confirm'),
                            variant: 'destructive',
                          });
                          if (ok) {
                            deleteMutation.mutate(doc.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </>
      )}
    </div>
  );
}
