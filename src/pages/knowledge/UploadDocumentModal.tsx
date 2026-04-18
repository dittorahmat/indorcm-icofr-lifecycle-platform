import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Loader2, Upload } from 'lucide-react';
import type { Department } from '@shared/types';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDocumentModal({ isOpen, onClose }: UploadDocumentModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Internal');
  const [category, setCategory] = useState('SOP');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ items: Department[] }>('/api/departments'),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      console.log('[FRONTEND] Starting upload mutation...');
      if (!file) {
        console.error('[FRONTEND] No file selected');
        throw new Error('File is required');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('type', type);
      formData.append('category', category);
      formData.append('departmentIds', JSON.stringify(selectedDepts));
      
      console.log('[FRONTEND] Sending POST /api/documents with data:', {
        title, type, category, departmentCount: selectedDepts.length
      });

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      console.log('[FRONTEND] Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[FRONTEND] Server responded with error:', errorText);
        throw new Error(`Upload failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      console.log('[FRONTEND] Upload successful:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Dokumen berhasil diunggah');
      onClose();
      reset();
    },
    onError: (e: any) => {
      console.error('[FRONTEND] Mutation error:', e);
      toast.error(`Gagal unggah: ${e.message}`);
    }
  });

  const reset = () => {
    setFile(null);
    setTitle('');
    setType('Internal');
    setCategory('SOP');
    setSelectedDepts([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Unggah Dokumen Baru</DialogTitle>
          <DialogDescription>
            Unggah file PDF dan atur metadata untuk pencarian AI yang lebih akurat.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">File PDF</Label>
            <Input 
              id="file" 
              type="file" 
              accept=".pdf" 
              onChange={(e) => {
                const f = e.target.files?.[0];
                console.log('[FRONTEND] File input changed:', f?.name);
                if (f) {
                  setFile(f);
                  if (!title) setTitle(f.name.replace('.pdf', ''));
                }
              }} 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Judul Dokumen</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: SOP Kas Kecil" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipe Akses</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">Internal (SOP)</SelectItem>
                  <SelectItem value="External">External (Regulasi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOP">SOP</SelectItem>
                  <SelectItem value="SK">SK Direksi</SelectItem>
                  <SelectItem value="UU">Undang-Undang</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'Internal' && (
            <div className="grid gap-2 border rounded-md p-4 bg-muted/20">
              <Label className="mb-2 block">Pilih Departemen Terkait</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
                {depts?.items.map((dept) => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dept-${dept.id}`} 
                      checked={selectedDepts.includes(dept.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedDepts([...selectedDepts, dept.id]);
                        else setSelectedDepts(selectedDepts.filter(id => id !== dept.id));
                      }}
                    />
                    <label htmlFor={`dept-${dept.id}`} className="text-sm font-medium leading-none cursor-pointer">{dept.name}</label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploadMutation.isPending}>Batal</Button>
          <Button onClick={() => uploadMutation.mutate()} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Unggah Dokumen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
