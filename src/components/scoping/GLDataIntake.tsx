import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { UploadCloud, File as FileIcon, X, BarChart3, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateBenfordDistribution, BENFORD_STANDARD } from '@/lib/compliance-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface GLRow {
  accountCode: string;
  accountName: string;
  balance: number;
}

interface GLDataIntakeProps {
  onDataImported: (data: GLRow[], pm: number) => void;
  pmThreshold: number;
}

export function GLDataIntake({ onDataImported, pmThreshold }: GLDataIntakeProps) {
  const [data, setData] = useState<GLRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [benfordData, setBenfordData] = useState<{ digit: number; actual: number; standard: number }[]>([]);
  const [balanceStatus, setBalanceStatus] = useState<{ total: number; isBalanced: boolean } | null>(null);

  const processData = (rawRows: any[]) => {
    // Map raw rows to GLRow format (Pragmatic mapping)
    const glRows: GLRow[] = rawRows.map(row => ({
      accountCode: row.accountCode || row['Account Code'] || row['Code'] || '',
      accountName: row.accountName || row['Account Name'] || row['Account'] || '',
      balance: parseFloat(row.balance || row['Balance'] || row['Amount'] || '0'),
    })).filter(row => row.accountName && !isNaN(row.balance));

    // 1. Balance Check
    const totalBalance = glRows.reduce((sum, row) => sum + row.balance, 0);
    const isBalanced = Math.abs(totalBalance) < 0.01;
    setBalanceStatus({ total: totalBalance, isBalanced });

    if (!isBalanced) {
      toast.error("GL Data is not balanced!", {
        description: `Total deviation: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalBalance)}`,
      });
    }

    // 2. Benford's Law Analysis
    const distribution = calculateBenfordDistribution(glRows.map(r => r.balance));
    const benfordChartData = distribution.map((val, i) => ({
      digit: i + 1,
      actual: parseFloat(val.toFixed(1)),
      standard: BENFORD_STANDARD[i],
    }));
    setBenfordData(benfordChartData);

    setData(glRows);
    onDataImported(glRows, pmThreshold);
    toast.success(`Successfully processed ${glRows.length} GL accounts.`);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const bstr = e.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      processData(json);
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (results) => processData(results.data),
      });
    } else {
      reader.readAsBinaryString(file);
    }
  }, [pmThreshold, onDataImported]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="p-10">
            <div {...getRootProps()} className={cn(
              "flex flex-col items-center justify-center space-y-4 cursor-pointer transition-colors",
              isDragActive && "text-primary"
            )}>
              <input {...getInputProps()} />
              <div className="p-4 rounded-full bg-primary/10">
                <UploadCloud className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Upload General Ledger</h3>
                <p className="text-sm text-muted-foreground">Drag & drop your GL Excel or CSV file here</p>
              </div>
              <Button variant="outline" size="sm">Select File</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl">Imported GL Data</CardTitle>
                <CardDescription>Reviewing {data.length} accounts from {fileName}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setData([]); setFileName(null); setBenfordData([]); }}>
                <X className="h-4 w-4 mr-2" /> Reset
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Significance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 50).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{row.accountCode}</TableCell>
                        <TableCell className="text-sm">{row.accountName}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {new Intl.NumberFormat('id-ID').format(row.balance)}
                        </TableCell>
                        <TableCell>
                          {Math.abs(row.balance) >= pmThreshold ? (
                            <Badge className="bg-orange-500">Above PM</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground opacity-50">Below PM</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground italic py-4">
                          Showing first 50 of {data.length} accounts...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className={cn(balanceStatus?.isBalanced ? "border-green-200 bg-green-50/20" : "border-destructive/20 bg-destructive/5")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                  <ShieldCheck className={cn("h-4 w-4", balanceStatus?.isBalanced ? "text-green-600" : "text-destructive")} />
                  Integrity Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Balance Check:</span>
                  {balanceStatus?.isBalanced ? (
                    <Badge className="bg-green-600">Balanced</Badge>
                  ) : (
                    <Badge variant="destructive">Unbalanced</Badge>
                  )}
                </div>
                <div className="mt-2 text-xs font-mono text-right">
                  Total: {new Intl.NumberFormat('id-ID').format(balanceStatus?.total || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Benford's Law Analysis
                </CardTitle>
                <CardDescription className="text-[10px]">Statistical audit for data manipulation detection.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={benfordData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="digit" fontSize={10} />
                      <YAxis fontSize={10} tickFormatter={(val) => `${val}%`} />
                      <Tooltip 
                        contentStyle={{ fontSize: '10px' }}
                        formatter={(val: number) => [`${val}%`]}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="actual" name="Actual Distribution" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      <Line type="monotone" dataKey="standard" name="Benford Standard" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 rounded bg-muted/30 border text-[10px] italic flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Large deviations from the red line may indicate artificial data entry or fraud risks (SK-5 Principle 8).</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
