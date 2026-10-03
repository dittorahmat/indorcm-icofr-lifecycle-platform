import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Plus, FileText, Trash2, Download, Search, Info, Eye, Loader2, Sparkles, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { UploadDocumentModal } from './UploadDocumentModal';
import { authClient } from '@/lib/auth-client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/hooks/use-confirm';

export const DocumentsPage = () => {
  const confirm = useConfirm();
  const { t } = useTranslation(['knowledge', 'common']);
  const [activeTab, setActiveTab] = useState('internal');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role;
  const canManage = userRole === 'Admin' || userRole === 'Line 2';

  const { data: docs, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      console.log('[FRONTEND] Fetching documents...');
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error('Failed to fetch documents');
      const json = await res.json();
      console.log('[FRONTEND] Received documents data:', json);
      return json.data as { items: any[] };
    },
    refetchInterval: (query) => {
      const data = query.state.data as { items: any[] } | undefined;
      const hasProcessing = data?.items?.some(d => d.status === 'processing');
      return hasProcessing ? 3000 : false;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(t('delete.success'));
    },
    onError: (e: any) => {
      toast.error(`${t('delete.error')}: ${e.message}`);
    }
  });

  const filteredDocs = docs?.items?.filter((d: any) => {
    const docType = (d.type || d.type_).toLowerCase();
    return activeTab === 'internal' ? docType === 'internal' : docType === 'external';
  }) || [];

  const hasProcessingDocs = filteredDocs.some((d: any) => d.status === 'processing');

  return (
    <AppLayout container>
      <div className="space-y-6 pt-2 md:pt-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pl-1">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold truncate">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          {canManage && (
            <Button onClick={() => setIsUploadModalOpen(true)} className="w-full sm:w-auto min-h-[44px] shrink-0">
              <Plus className="mr-2 h-4 w-4" /> {t('upload.button')}
            </Button>
          )}
        </div>

        <UploadDocumentModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
        />

        {hasProcessingDocs && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3.5 flex items-center gap-3 text-amber-900 text-sm shadow-sm animate-in fade-in duration-300">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">AI sedang mempelajari dokumen baru di background...</span>
              <span className="ml-1 text-amber-800">Persentase progress di bawah akan diperbarui secara otomatis tanpa perlu me-refresh halaman.</span>
            </div>
          </div>
        )}

        <Tabs defaultValue="internal" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="internal">{t('tabs.internal')}</TabsTrigger>
            <TabsTrigger value="external">{t('tabs.external')}</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="min-w-0 truncate">{activeTab === 'internal' ? t('card.internalTitle') : t('card.externalTitle')}</CardTitle>
                  <div className="relative w-full sm:w-72 shrink-0">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('card.searchPlaceholder')} className="pl-8" />
                  </div>
                </div>
                <CardDescription>
                  {activeTab === 'internal' 
                    ? t('card.internalDesc') 
                    : t('card.externalDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.title')}</TableHead>
                      <TableHead>{t('table.category')}</TableHead>
                      <TableHead>{t('table.uploadDate')}</TableHead>
                      <TableHead>Status AI Indexing</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center">{t('table.loading')}</TableCell></TableRow>
                    ) : filteredDocs.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('table.empty')}</TableCell></TableRow>
                    ) : filteredDocs.map((doc) => {
                      const isProcessing = doc.status === 'processing';
                      const progress = doc.indexingProgress ?? (isProcessing ? 0 : 100);

                      return (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                            <span className="truncate max-w-[280px]" title={doc.title}>{doc.title}</span>
                          </TableCell>
                          <TableCell>{doc.category || '-'}</TableCell>
                          <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {isProcessing ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                                  Memproses {progress}%
                                </span>
                                <div className="w-28 bg-amber-100/80 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                                    style={{ width: `${Math.max(5, progress)}%` }} 
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Sparkles className="h-3 w-3 text-emerald-600" />
                                Siap Ditanyakan
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title={t('common:actions.view') || 'Lihat'}
                              onClick={() => window.open(`/api/documents/download/${doc.id}?mode=view`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title={t('common:actions.download') || 'Download'}
                              onClick={() => window.open(`/api/documents/download/${doc.id}`, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                                title={t('common:actions.delete')}
                                disabled={deleteMutation.isPending}
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: t('common:actions.deletePermanently'),
                                    description: t('delete.confirm') || 'Delete this document?',
                                    confirmText: t('common:actions.delete'),
                                    variant: 'destructive'
                                  });
                                  if (ok) {
                                    deleteMutation.mutate(doc.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
};
