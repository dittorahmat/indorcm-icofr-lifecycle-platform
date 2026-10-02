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
import { useTranslation } from 'react-i18next';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    const pdfWorker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.warn('[FRONTEND] Client-side PDF text extraction failed (will rely on backend/content if available):', error);
    return '';
  }
}

export function UploadDocumentModal({ isOpen, onClose }: UploadDocumentModalProps) {
  const { t } = useTranslation(['knowledge', 'common']);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Internal');
  const [category, setCategory] = useState('SOP');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<{ items: Department[] }>('/api/departments'),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      console.log('[FRONTEND] Starting upload mutation...');
      if (!file) {
        console.error('[FRONTEND] No file selected');
        throw new Error(t('upload.labelFile') + ' is required');
      }

      setIsExtracting(true);
      let extractedText = '';
      try {
        console.log('[FRONTEND] Extracting text from PDF in browser...');
        extractedText = await extractTextFromPdf(file);
        console.log('[FRONTEND] PDF text extraction complete, length:', extractedText.length);
      } catch (err) {
        console.warn('[FRONTEND] Failed to extract text from PDF in browser:', err);
      } finally {
        setIsExtracting(false);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('type', type);
      formData.append('category', category);
      formData.append('content', extractedText);
      formData.append('departmentIds', JSON.stringify(selectedDepts));
      
      console.log('[FRONTEND] Sending POST /api/documents with data:', {
        title, type, category, departmentCount: selectedDepts.length, contentSize: extractedText.length
      });

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      console.log('[FRONTEND] Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[FRONTEND] Server responded with error:', errorText);
        throw new Error(`${t('upload.error')} (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      console.log('[FRONTEND] Upload successful:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(t('upload.success'));
      onClose();
      reset();
    },
    onError: (e: any) => {
      console.error('[FRONTEND] Mutation error:', e);
      toast.error(`${t('upload.error')}: ${e.message}`);
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
          <DialogTitle>{t('upload.modalTitle')}</DialogTitle>
          <DialogDescription>
            {t('upload.modalDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">{t('upload.labelFile')}</Label>
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
            <Label htmlFor="title">{t('upload.labelTitle')}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('upload.titlePlaceholder')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t('upload.labelAccess')}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">{t('tabs.internal')}</SelectItem>
                  <SelectItem value="External">{t('tabs.external')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t('upload.labelCategory')}</Label>
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
              <Label className="mb-2 block">{t('upload.labelDepts')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
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
          <Button variant="outline" onClick={onClose} disabled={uploadMutation.isPending || isExtracting}>{t('common:actions.cancel')}</Button>
          <Button onClick={() => uploadMutation.mutate()} disabled={!file || uploadMutation.isPending || isExtracting}>
            {(uploadMutation.isPending || isExtracting) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isExtracting ? 'Extracting PDF...' : t('upload.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
