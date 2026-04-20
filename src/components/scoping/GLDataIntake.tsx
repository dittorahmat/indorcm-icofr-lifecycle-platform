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
import { calculateBenfordDistribution, BENFORD_STANDARD, parseBalance, detectGLColumns, validateGLMapping, filterEmptyRows, GL_COLUMN_MAPPING } from '@/lib/compliance-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface GLRow {
  accountCode: string;
  accountName: string;
  balance: number;
  fsliCode?: string;
  entityCode?: string;
  currency?: string;
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
  const [detectedMapping, setDetectedMapping] = useState<Record<string, string> | null>(null);
  const [emptyRowCount, setEmptyRowCount] = useState(0);

  const processData = (rawRows: any[], headers?: string[]) => {
    console.log('========== [GL DEBUG] START PROCESSING ==========');
    console.log('[1] Raw rows received:', rawRows.length);
    console.log('[1] Headers:', headers);
    console.log('[1] First 3 raw rows:', rawRows.slice(0, 3));
    
    // 1. Filter empty rows
    const filteredRows = filterEmptyRows(rawRows);
    const emptyCount = rawRows.length - filteredRows.length;
    console.log('[2] After filtering empty rows:', filteredRows.length, '(removed:', emptyCount, ')');
    console.log('[2] First 3 filtered rows:', filteredRows.slice(0, 3));
    
    setEmptyRowCount(emptyCount);
    if (emptyCount > 0) {
      toast.info(`Filtered ${emptyCount} empty rows`);
    }

    // 2. Auto-detect column mapping
    let mapping: Record<string, string>;
    if (headers && headers.length > 0) {
      console.log('[3] Detecting columns from headers:', headers);
      mapping = detectGLColumns(headers);
    } else {
      const firstRowKeys = Object.keys(filteredRows[0] || {});
      console.log('[3] Detecting columns from first row keys:', firstRowKeys);
      mapping = detectGLColumns(firstRowKeys);
    }
    console.log('[3] Detected mapping:', mapping);
    setDetectedMapping(mapping);

    // 3. Validate mapping
    const validation = validateGLMapping(mapping);
    console.log('[4] Validation result:', validation);
    if (!validation.valid) {
      toast.error(`Missing required columns: ${validation.missing.join(', ')}`, {
        description: `Expected columns: ${validation.missing.map(m => Object.keys(GL_COLUMN_MAPPING).find(k => (GL_COLUMN_MAPPING[k as keyof typeof GL_COLUMN_MAPPING] as unknown as string[]).includes(m)) || m).join(', ')}`
      });
      console.log('[4] ❌ VALIDATION FAILED - Returning early');
      return;
    }
    console.log('[4] ✅ Validation PASSED');

    // 4. Map rows using detected mapping
    console.log('[5] Starting row mapping...');
    const glRows: GLRow[] = filteredRows.map((row, index) => {
      // Get raw balance value - handle various column name formats
      let balanceRaw = row[mapping.balance];
      
      // Try lowercase if not found
      if (!balanceRaw && mapping.balance?.toLowerCase()) {
        balanceRaw = row[mapping.balance.toLowerCase()];
      }
      
      // Fallback to '0' if still not found
      if (!balanceRaw) {
        balanceRaw = '0';
      }
      
      if (index < 3) {
        console.log(`[5] Row ${index}:`, {
          balanceColumn: mapping.balance,
          balanceRaw: balanceRaw,
          balanceType: typeof balanceRaw,
          accountName: row[mapping.accountName]
        });
      }
      
      // Parse balance using Indonesian format parser
      const parsedBalance = parseBalance(balanceRaw);
      
      if (index < 3) {
        console.log(`[5] Row ${index} parsed:`, parsedBalance);
      }

      if (!parsedBalance.success) {
        toast.warning(`Invalid balance for ${row[mapping.accountName] || 'Unknown'}: ${balanceRaw}`);
      }

      return {
        accountCode: row[mapping.accountCode] || row[mapping.accountCode?.toLowerCase()] || '',
        accountName: row[mapping.accountName] || row[mapping.accountName?.toLowerCase()] || '',
        balance: parsedBalance.value,
        fsliCode: mapping.fsliCode ? (row[mapping.fsliCode] || row[mapping.fsliCode?.toLowerCase()]) : undefined,
        entityCode: mapping.entityCode ? (row[mapping.entityCode] || row[mapping.entityCode?.toLowerCase()]) : undefined,
        currency: mapping.currency ? (row[mapping.currency] || row[mapping.currency?.toLowerCase()]) : undefined,
      };
    }).filter(row => {
      const hasBalance = row.balance !== undefined && row.balance !== 0;
      if (!hasBalance) {
        console.log('[5] Filtered out row with 0 balance:', row.accountName);
      }
      return row.accountName && row.balance !== undefined;
    });
    
    console.log('[5] ✅ Mapped rows:', glRows.length);
    console.log('[5] First 3 mapped rows:', glRows.slice(0, 3));

    // 5. Balance Check
    const totalBalance = glRows.reduce((sum, row) => sum + row.balance, 0);
    const isBalanced = Math.abs(totalBalance) < 0.01;
    setBalanceStatus({ total: totalBalance, isBalanced });

    if (!isBalanced) {
      toast.error("GL Data is not balanced!", {
        description: `Total deviation: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalBalance)}`,
      });
    }

    // 6. Benford's Law Analysis
    const distribution = calculateBenfordDistribution(glRows.map(r => r.balance));
    const benfordChartData = distribution.map((val, i) => ({
      digit: i + 1,
      actual: parseFloat(val.toFixed(1)),
      standard: BENFORD_STANDARD[i],
    }));
    setBenfordData(benfordChartData);

    setData(glRows);
    onDataImported(glRows, pmThreshold);
    toast.success(`Successfully processed ${glRows.length} GL accounts from ${fileName || 'uploaded file'}`);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);

    if (file.name.endsWith('.csv')) {
      // CSV: Auto-detect delimiter (comma, semicolon, tab)
      Papa.parse(file, {
        header: true,
        skipEmptyLines: false,
        transformHeader: (header) => header.trim(), // TRIM SPACES!
        complete: (results) => {
          const headers = results.meta.fields || [];
          processData(results.data, headers);
        },
        error: (error) => {
          toast.error(`Failed to parse CSV: ${error.message}`);
        }
      });
    } else {
      // Excel: Read as binary
      const reader = new FileReader();
      reader.onload = (e) => {
        const bstr = e.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        // TRIM field names untuk XLSX juga!
        const trimmedJson = json.map((row: any) => {
          const trimmedRow: any = {};
          Object.keys(row).forEach(key => {
            trimmedRow[key.trim()] = row[key];
          });
          return trimmedRow;
        });
        
        // For Excel, detect columns from first row keys
        const headers = trimmedJson.length > 0 ? Object.keys(trimmedJson[0]) : [];
        processData(trimmedJson, headers);
      };
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
                <p className="text-xs text-muted-foreground mt-1">Support: .csv, .xlsx, .xls</p>
              </div>
              <Button variant="outline" size="sm">Select File</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl">Imported GL Data</CardTitle>
                <CardDescription>
                  Reviewing {data.length} accounts from {fileName}
                  {detectedMapping && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      Detected: {Object.entries(detectedMapping).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </div>
                  )}
                  {emptyRowCount > 0 && (
                    <div className="text-xs mt-1 text-orange-600">
                      Filtered {emptyRowCount} empty rows
                    </div>
                  )}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setData([]); setFileName(null); setBenfordData([]); setDetectedMapping(null); setEmptyRowCount(0); }}>
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
                      {data[0]?.fsliCode && <TableHead>FSLI Code</TableHead>}
                      <TableHead>Significance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 50).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{row.accountCode || '-'}</TableCell>
                        <TableCell className="text-sm">{row.accountName}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {new Intl.NumberFormat('id-ID').format(row.balance)}
                        </TableCell>
                        {row.fsliCode && <TableCell className="font-mono text-xs">{row.fsliCode}</TableCell>}
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
                        <TableCell colSpan={data[0]?.fsliCode ? 5 : 4} className="text-center text-muted-foreground italic py-4">
                          Showing first 50 of {data.length} accounts...
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-1">
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
                <div className="h-[300px] w-full mt-4">
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
