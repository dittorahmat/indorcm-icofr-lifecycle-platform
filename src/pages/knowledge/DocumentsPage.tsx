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
  Plus, FileText, Trash2, Download, Search, Info, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { UploadDocumentModal } from './UploadDocumentModal';
import { authClient } from '@/lib/auth-client';

export const DocumentsPage = () => {
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
      // FIX: The items are inside json.data.items
      return json.data as { items: any[] };
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
      toast.success('Dokumen berhasil dihapus');
    },
    onError: (e: any) => {
      toast.error(`Gagal menghapus: ${e.message}`);
    }
  });

  // FIX: Make filtering case-insensitive and more robust
  const filteredDocs = docs?.items?.filter((d: any) => {
    const docType = (d.type || d.type_).toLowerCase();
    return activeTab === 'internal' ? docType === 'internal' : docType === 'external';
  }) || [];

  console.log('[FRONTEND] Active Tab:', activeTab);
  console.log('[FRONTEND] Filtered Documents count:', filteredDocs.length);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dokumen Terkait</h1>
          <p className="text-muted-foreground">Pusat pengetahuan regulasi dan SOP ICOFR.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Dokumen
          </Button>
        )}
      </div>

      <UploadDocumentModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

      <Tabs defaultValue="internal" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="internal">Internal (SOP)</TabsTrigger>
          <TabsTrigger value="external">External (Regulasi)</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>{activeTab === 'internal' ? 'SOP Perusahaan' : 'Undang-Undang & Regulasi'}</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari dokumen..." className="pl-8" />
                </div>
              </div>
              <CardDescription>
                {activeTab === 'internal' 
                  ? 'Dokumen prosedur internal yang di-mapping ke departemen terkait.' 
                  : 'Regulasi pemerintah, standar akuntansi, dan UU terkait BUMN.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul Dokumen</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tanggal Upload</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Memuat dokumen...</TableCell></TableRow>
                  ) : filteredDocs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada dokumen di tab ini.</TableCell></TableRow>
                  ) : filteredDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-blue-500" />
                        {doc.title}
                      </TableCell>
                      <TableCell>{doc.category || '-'}</TableCell>
                      <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Lihat"
                          onClick={() => window.open(`/api/documents/download/${doc.id}?mode=view`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Download"
                          onClick={() => window.open(`/api/documents/download/${doc.id}`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canManage && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                            title="Hapus"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
                                deleteMutation.mutate(doc.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};
