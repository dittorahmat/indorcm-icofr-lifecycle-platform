import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Server,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Lock,
  RefreshCw,
  Code,
  Cpu,
  Layers,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Edit,
  X,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Application, ApplicationDocument, Control, ITGCArea } from '@shared/types';
import { AddApplicationDialog } from './AddApplicationDialog';

interface ApplicationDetailDialogProps {
  application: Application | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditApplication?: (app: Application) => void;
  defaultTab?: string;
}

export function ApplicationDetailDialog({
  application,
  isOpen,
  onOpenChange,
  onEditApplication,
  defaultTab = 'tlc',
}: ApplicationDetailDialogProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Sync tab if default changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const appId = application?.id;

  // 1. Fetch linked controls (TLC and ITGC)
  const { data: controlsData, isLoading: isLoadingControls } = useQuery({
    queryKey: ['application-controls', appId],
    queryFn: () => api<{ application: Application; tlcControls: Control[]; itgcControls: Control[]; totalControls: number }>(`/api/applications/${appId}/controls`),
    enabled: !!appId && isOpen,
  });

  const tlcControls = controlsData?.tlcControls || [];
  const itgcControls = controlsData?.itgcControls || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-[94vw] max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border-slate-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 border-b border-slate-800 shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-400/30 text-indigo-400">
                    <Server className="h-5 w-5" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-white">
                    {application?.name}
                  </DialogTitle>
                  {application?.isSignificant && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                      {t('rcm:application_detail.significant_badge')}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      application?.criticality === 'High'
                        ? 'border-red-400/40 text-red-300 bg-red-950/40'
                        : 'border-slate-600 text-slate-300 bg-slate-800'
                    }
                  >
                    {t('rcm:application_detail.criticality')}: {application?.criticality || 'Medium'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      application?.statusITGC === 'Effective'
                        ? 'border-emerald-400/40 text-emerald-300 bg-emerald-950/40'
                        : 'border-amber-400/40 text-amber-300 bg-amber-950/40'
                    }
                  >
                    ITGC: {application?.statusITGC || 'In Scope'}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-300 line-clamp-2 max-w-3xl">
                  {application?.description || t('rcm:application_detail.subtitle')}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {application?.architectureDocUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 gap-1.5"
                    onClick={() => {
                      setPreviewFile({
                        url: application.architectureDocUrl!,
                        name: application.architectureDocName || 'Architecture.pdf',
                        type: 'application/pdf',
                      });
                    }}
                  >
                    <FileSearch className="h-3.5 w-3.5 text-blue-400" />
                    <span>{application.architectureDocName || 'Architecture'}</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border-indigo-500/30 gap-1.5"
                  onClick={() => {
                    if (onEditApplication && application) {
                      onEditApplication(application);
                    } else {
                      setIsEditDialogOpen(true);
                    }
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>{t('rcm:application_detail.edit_app')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* 6 Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
              <TabsList className="bg-transparent p-0 h-10 gap-1 sm:gap-2 flex-wrap">
                <TabsTrigger
                  value="tlc"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-t-md px-3 py-1.5 text-xs font-medium gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{t('rcm:application_detail.tabs.tlc')}</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1 font-semibold">
                    {tlcControls.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="itgc"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-t-md px-3 py-1.5 text-xs font-medium gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{t('rcm:application_detail.tabs.itgc')}</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1 font-semibold">
                    {itgcControls.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="access"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-t-md px-3 py-1.5 text-xs font-medium gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-blue-500" />
                  <span>{t('rcm:application_detail.tabs.access')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="changes"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-t-md px-3 py-1.5 text-xs font-medium gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t('rcm:application_detail.tabs.changes')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="development"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-t-md px-3 py-1.5 text-xs font-medium gap-1.5"
                >
                  <Code className="h-3.5 w-3.5 text-purple-500" />
                  <span>{t('rcm:application_detail.tabs.development')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="operations"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-t-md px-3 py-1.5 text-xs font-medium gap-1.5"
                >
                  <Cpu className="h-3.5 w-3.5 text-cyan-500" />
                  <span>{t('rcm:application_detail.tabs.operations')}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {/* TAB 1: RCM TLC */}
              <TabsContent value="tlc" className="m-0 space-y-4 focus-visible:outline-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {t('rcm:application_detail.tabs.tlc')} - {application?.name}
                    </h3>
                    <p className="text-xs text-slate-500">{t('rcm:application_detail.tlc_desc')}</p>
                  </div>
                </div>

                <ControlsTable
                  controls={tlcControls}
                  isLoading={isLoadingControls}
                  emptyMessage={t('rcm:application_detail.no_tlc_controls')}
                  matrixType="tlc"
                />
              </TabsContent>

              {/* TAB 2: RCM ITGC */}
              <TabsContent value="itgc" className="m-0 space-y-4 focus-visible:outline-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {t('rcm:application_detail.tabs.itgc')} - {application?.name}
                    </h3>
                    <p className="text-xs text-slate-500">{t('rcm:application_detail.itgc_desc')}</p>
                  </div>
                </div>

                <ControlsTable
                  controls={itgcControls}
                  isLoading={isLoadingControls}
                  emptyMessage={t('rcm:application_detail.no_itgc_controls')}
                  matrixType="itgc"
                />
              </TabsContent>

              {/* TAB 3: Access to Program and Data */}
              <TabsContent value="access" className="m-0 space-y-4 focus-visible:outline-none">
                <ITGCEvidenceLibrary
                  applicationId={appId!}
                  itgcArea="Access to Program and Data"
                  domainTitle={t('rcm:application_detail.tabs.access')}
                  domainDescription={t('rcm:matrix.itgc.domains.access', {
                    defaultValue: 'Controls over access rights to applications, databases, operating systems, and networks.',
                  })}
                  onPreviewFile={setPreviewFile}
                />
              </TabsContent>

              {/* TAB 4: Program Changes */}
              <TabsContent value="changes" className="m-0 space-y-4 focus-visible:outline-none">
                <ITGCEvidenceLibrary
                  applicationId={appId!}
                  itgcArea="Program Changes"
                  domainTitle={t('rcm:application_detail.tabs.changes')}
                  domainDescription={t('rcm:matrix.itgc.domains.changes', {
                    defaultValue: 'Controls ensuring all system/application changes undergo formal request, testing, and approval.',
                  })}
                  onPreviewFile={setPreviewFile}
                />
              </TabsContent>

              {/* TAB 5: Program Development */}
              <TabsContent value="development" className="m-0 space-y-4 focus-visible:outline-none">
                <ITGCEvidenceLibrary
                  applicationId={appId!}
                  itgcArea="Program Development"
                  domainTitle={t('rcm:application_detail.tabs.development')}
                  domainDescription={t('rcm:matrix.itgc.domains.development', {
                    defaultValue: 'Controls ensuring development or acquisition meets requirements, architecture standards, and authorization.',
                  })}
                  onPreviewFile={setPreviewFile}
                />
              </TabsContent>

              {/* TAB 6: Computer Operations */}
              <TabsContent value="operations" className="m-0 space-y-4 focus-visible:outline-none">
                <ITGCEvidenceLibrary
                  applicationId={appId!}
                  itgcArea="Computer Operations"
                  domainTitle={t('rcm:application_detail.tabs.operations')}
                  domainDescription={t('rcm:matrix.itgc.domains.operations', {
                    defaultValue: 'Controls ensuring batch processing accuracy, job scheduling, backup & recovery verification, and incident management.',
                  })}
                  onPreviewFile={setPreviewFile}
                />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* In-App File Preview Modal */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="text-sm font-semibold truncate">{previewFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Download className="h-3 w-3" /> Download
                </a>
              </div>
            </div>
            <div className="flex-1 bg-slate-950/20 p-4 flex items-center justify-center overflow-auto min-h-[400px]">
              {previewFile.url.endsWith('.pdf') || previewFile.type === 'application/pdf' ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="w-full h-[70vh] border border-slate-200 rounded-md bg-white"
                />
              ) : previewFile.url.match(/\.(png|jpe?g|webp|svg|gif)$/i) || previewFile.type.startsWith('image/') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-[70vh] max-w-full object-contain rounded shadow-sm"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-600 font-medium">{previewFile.name}</p>
                  <p className="text-xs text-slate-400">Preview not available for this file type.</p>
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" /> Download File
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit App Dialog */}
      {isEditDialogOpen && (
        <AddApplicationDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          initialData={application}
        />
      )}
    </>
  );
}

// Sub-component: Controls Table for TLC and ITGC tabs
function ControlsTable({
  controls,
  isLoading,
  emptyMessage,
  matrixType,
}: {
  controls: Control[];
  isLoading: boolean;
  emptyMessage: string;
  matrixType: 'tlc' | 'itgc';
}) {
  const { t } = useTranslation(['rcm', 'common']);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
        <span>Loading controls...</span>
      </div>
    );
  }

  if (controls.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg space-y-2">
        <Layers className="h-8 w-8 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
        <p className="text-xs text-slate-400">
          Assign this application to controls in the BPM Editor or RCM Worksheet to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[120px] text-xs font-bold text-slate-700">Control ID</TableHead>
            <TableHead className="text-xs font-bold text-slate-700">Control Name & Description</TableHead>
            {matrixType === 'itgc' && (
              <TableHead className="w-[140px] text-xs font-bold text-slate-700">ITGC Domain</TableHead>
            )}
            <TableHead className="w-[110px] text-xs font-bold text-slate-700">Type</TableHead>
            <TableHead className="w-[110px] text-xs font-bold text-slate-700">Nature</TableHead>
            <TableHead className="w-[100px] text-xs font-bold text-slate-700">Frequency</TableHead>
            <TableHead className="w-[80px] text-center text-xs font-bold text-slate-700">Key</TableHead>
            <TableHead className="w-[110px] text-right text-xs font-bold text-slate-700">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {controls.map((ctrl) => (
            <TableRow key={ctrl.id} className="hover:bg-slate-50/60 transition-colors">
              <TableCell className="font-bold text-xs text-indigo-700 whitespace-nowrap">
                {ctrl.code}
              </TableCell>
              <TableCell className="space-y-0.5 max-w-[320px]">
                <div className="font-semibold text-xs text-slate-800 truncate">{ctrl.name}</div>
                {ctrl.description && (
                  <div className="text-[11px] text-slate-500 line-clamp-1">{ctrl.description}</div>
                )}
              </TableCell>
              {matrixType === 'itgc' && (
                <TableCell>
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
                    {ctrl.itgcDomain || 'ITGC'}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    ctrl.type === 'Preventive' || ctrl.type === 'Preventif'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px]'
                      : 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]'
                  }
                >
                  {ctrl.type || '-'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-slate-600 whitespace-nowrap">{ctrl.nature || '-'}</TableCell>
              <TableCell className="text-xs text-slate-600 whitespace-nowrap">{ctrl.frequency || '-'}</TableCell>
              <TableCell className="text-center">
                {ctrl.isKeyControl ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-[10px] font-bold">
                    Key
                  </Badge>
                ) : (
                  <span className="text-slate-300 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1 px-2"
                  onClick={() => {
                    const targetPath = matrixType === 'tlc' ? '/rcm/tlc' : '/rcm/itgc';
                    window.open(`${targetPath}?search=${encodeURIComponent(ctrl.code)}`, '_blank');
                  }}
                  title={t('rcm:application_detail.view_in_rcm')}
                >
                  <span>{t('rcm:application_detail.preview')}</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Sub-component: ITGC Evidence Library (Tabs 3 - 6)
function ITGCEvidenceLibrary({
  applicationId,
  itgcArea,
  domainTitle,
  domainDescription,
  onPreviewFile,
}: {
  applicationId: string;
  itgcArea: ITGCArea;
  domainTitle: string;
  domainDescription: string;
  onPreviewFile: (file: { url: string; name: string; type: string }) => void;
}) {
  const { t } = useTranslation(['rcm', 'common']);
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
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
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
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title={t('rcm:application_detail.delete')}
                        onClick={() => {
                          if (window.confirm(t('rcm:application_detail.delete_doc_confirm'))) {
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
      )}
    </div>
  );
}
