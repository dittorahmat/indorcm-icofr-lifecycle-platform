import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { UploadCloud, File as FileIcon, X, Download, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const rcmRowSchema = z.object({
  process: z.string().min(1, "Process is required"),
  subProcess: z.string().min(1, "Sub-process is required"),
  riskDescription: z.string().min(1, "Risk description is required"),
  controlName: z.string().min(1, "Control name is required"),
  controlDescription: z.string().min(1, "Control description is required"),
});

type RcmRow = z.infer<typeof rcmRowSchema>;
type ValidatedRow = { data: RcmRow; errors: z.ZodIssue[] | null };

const SAMPLE_CSV = `process,subProcess,riskDescription,controlName,controlDescription
Procure-to-Pay (P2P),Vendor Onboarding,Risk of onboarding fraudulent vendors,P2P-03: Vendor Due Diligence,Background checks are performed on all new vendors before approval.
Record-to-Report (R2R),Journal Entry,Risk of unauthorized journal entries,R2R-02: JE Approval Workflow,All manual journal entries require approval from a finance manager.`;

export function ImportPage() {
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (fileContent: string) => api('/api/import/rcm', { method: 'POST', body: JSON.stringify({ fileContent }) }),
    onSuccess: (result: { imported: number; errors: string[] }) => {
      toast.success(`Import complete! ${result.imported} rows imported.`);
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} rows had errors.`, {
          description: result.errors.slice(0, 5).join('\n'),
        });
      }
      setRows([]);
      setFileName(null);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvData = event.target?.result as string;
        import('papaparse').then((mod) => {
          const Papa = mod.default || mod;
          Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
              const validated = results.data.map((row: RcmRow) => {
                const validationResult = rcmRowSchema.safeParse(row);
                return {
                  data: row,
                  errors: validationResult.success ? null : validationResult.error.issues,
                };
              });
              setRows(validated);
            },
          });
        }).catch((err) => {
          toast.error('Failed to parse CSV file.');
          console.error(err);
        });
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

  const handleImport = () => {
    const validRows = rows.filter(r => !r.errors);
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }
    import('papaparse').then((mod) => {
      const Papa = mod.default || mod;
      const csvToUpload = Papa.unparse(validRows.map(r => r.data));
      mutation.mutate(csvToUpload);
    }).catch((err) => {
      toast.error('Failed to prepare CSV for upload.');
      console.error(err);
    });
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "rcm_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasErrors = rows.some(r => r.errors);
  const mockRole = localStorage.getItem('mockRole') || 'Line 1';
  const isAuthorized = mockRole === 'Line 2';

  return (
    <AppLayout container>
      <div className="max-w-7xl mx-auto">
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Bulk Import RCM</h1>
              <p className="text-muted-foreground">Upload a CSV file to bulk-create processes, risks, and controls.</p>
              {!isAuthorized && (
                <Card className="mt-4 bg-destructive/5 border-destructive/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Access restricted</p>
                      <p className="text-sm text-muted-foreground">Only users with the 'Line 2' role can perform imports. Upload and download are disabled.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate} disabled={!isAuthorized} className="shadow-sm">
              <Download className="h-4 w-4 mr-2" /> Download Template
            </Button>
          </div>
          <Card className="shadow-sm border-muted">
            <CardContent className="p-6">
              {rows.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div {...getRootProps()} className={cn("flex justify-center rounded-md border-2 border-dashed border-input px-6 py-12 cursor-pointer hover:border-primary transition-colors bg-muted/30", isDragActive && 'border-primary bg-accent', !isAuthorized && 'pointer-events-none opacity-50')}>
                    <input {...getInputProps()} />
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Drag & drop a CSV file here, or click to select</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium">{fileName}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setRows([]); setFileName(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-auto border rounded-md shadow-inner bg-background">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted z-10">
                        <TableRow>{Object.keys(rcmRowSchema.shape).map(key => <TableHead key={key} className="uppercase text-[10px] font-bold">{key}</TableHead>)}</TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, index) => (
                          <TableRow key={index} className={cn(row.errors && "bg-destructive/5")}>
                            {Object.keys(rcmRowSchema.shape).map(key => (
                              <TableCell key={key} className={cn("text-xs", row.errors?.some(e => e.path[0] === key) && "text-destructive font-medium")}>
                                {row.data[key as keyof RcmRow]}
                                {row.errors?.some(e => e.path[0] === key) && <Badge variant="destructive" className="ml-2 text-[8px] h-4">Error</Badge>}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div>{hasErrors && <p className="text-xs text-destructive font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Some rows have validation errors and will be skipped.</p>}</div>
                    <Button onClick={handleImport} disabled={mutation.status === 'pending' || rows.filter(r => !r.errors).length === 0 || !isAuthorized} className="min-w-[150px]">
                      {mutation.status === 'pending' ? 'Importing...' : `Import ${rows.filter(r => !r.errors).length} Valid Rows`}
                    </Button>
                  </div>
                  {mutation.status === 'pending' && (
                    <div className="mt-4 flex items-center gap-3">
                      <Progress className="h-1.5 w-full" />
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" aria-hidden />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}