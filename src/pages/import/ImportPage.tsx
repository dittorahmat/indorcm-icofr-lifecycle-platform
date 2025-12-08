import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import Papa from 'papaparse';
import { z } from 'zod';
import { MainHeader } from '@/components/layout/MainHeader';
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
        Papa.parse<RcmRow>(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const validated = results.data.map(row => {
              const validationResult = rcmRowSchema.safeParse(row);
              return {
                data: row,
                errors: validationResult.success ? null : validationResult.error.issues,
              };
            });
            setRows(validated);
          },
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
    const csvToUpload = Papa.unparse(validRows.map(r => r.data));
    mutation.mutate(csvToUpload);
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
  if (mockRole !== 'Line 2') {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <MainHeader />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8 md:py-10 lg:py-12">
              <Card>
                <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                  <h2 className="text-2xl font-bold">Access Denied</h2>
                  <p className="text-muted-foreground">Only users with the 'Line 2' role can access the bulk import feature.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Bulk Import RCM</h1>
                <p className="text-muted-foreground">Upload a CSV file to bulk-create processes, risks, and controls.</p>
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate}><Download className="h-4 w-4 mr-2" /> Download Template</Button>
            </div>
            <Card>
              <CardContent className="p-6">
                {rows.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div {...getRootProps()} className={cn("flex justify-center rounded-md border-2 border-dashed border-input px-6 py-12 cursor-pointer hover:border-primary transition-colors", isDragActive && 'border-primary bg-accent')}>
                      <input {...getInputProps()} />
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Drag & drop a CSV file here, or click to select</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between p-3 mb-4 rounded-md border bg-background">
                      <div className="flex items-center gap-2"><FileIcon className="h-6 w-6 text-muted-foreground" /><span className="text-sm font-medium">{fileName}</span></div>
                      <Button variant="ghost" size="icon" onClick={() => { setRows([]); setFileName(null); }}><X className="h-4 w-4" /></Button>
                    </div>
                    <div className="max-h-96 overflow-auto border rounded-md">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                          <TableRow>{Object.keys(rcmRowSchema.shape).map(key => <TableHead key={key}>{key}</TableHead>)}</TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row, index) => (
                            <TableRow key={index} className={cn(row.errors && "bg-destructive/10")}>
                              {Object.keys(rcmRowSchema.shape).map(key => (
                                <TableCell key={key} className="text-sm">
                                  {row.data[key as keyof RcmRow]}
                                  {row.errors?.some(e => e.path[0] === key) && <Badge variant="destructive" className="ml-2">Error</Badge>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <div>{hasErrors && <p className="text-sm text-destructive">Some rows have errors and will be skipped.</p>}</div>
                      <Button onClick={handleImport} disabled={mutation.status === 'pending' || rows.filter(r => !r.errors).length === 0}>
                        {mutation.status === 'pending' ? 'Importing...' : `Import ${rows.filter(r => !r.errors).length} Valid Rows`}
                      </Button>
                    </div>
                    {mutation.status === 'pending' && <Progress value={100} className="mt-4 h-2 animate-pulse" />}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}