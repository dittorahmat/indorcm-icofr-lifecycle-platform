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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('scoping');
  const [data, setData] = useState<GLRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [benfordData, setBenfordData] = useState<{ digit: number; actual: number; standard: number }[]>([]);
  const [balanceStatus, setBalanceStatus] = useState<{ total: number; isBalanced: boolean } | null>(null);
  const [detectedMapping, setDetectedMapping] = useState<Record<string, string> | null>(null);
  const [emptyRowCount, setEmptyRowCount] = useState(0);

  const processData = useCallback((rawRows: any[], headers?: string[]) => {
    // 1. Filter empty rows
    const filteredRows = filterEmptyRows(rawRows);
    const emptyCount = rawRows.length - filteredRows.length;
    
    setEmptyRowCount(emptyCount);
    if (emptyCount > 0) {
      toast.info(t('intake.notifications.filtered', { count: emptyCount }));
    }

    // 2. Auto-detect column mapping
    let mapping: Record<string, string>;
    if (headers && headers.length > 0) {
      mapping = detectGLColumns(headers);
    } else {
      const firstRowKeys = Object.keys(filteredRows[0] || {});
      mapping = detectGLColumns(firstRowKeys);
    }
    setDetectedMapping(mapping);

    // 3. Validate mapping
    const validation = validateGLMapping(mapping);
    if (!validation.valid) {
      toast.error(t('intake.notifications.missingColumns', { columns: validation.missing.join(', ') }), {
        description: t('intake.notifications.expectedColumns', { 
          expected: validation.missing.map(m => Object.keys(GL_COLUMN_MAPPING).find(k => (GL_COLUMN_MAPPING[k as keyof typeof GL_COLUMN_MAPPING] as unknown as string[]).includes(m)) || m).join(', ') 
        })
      });
      return;
    }

    // 4. Map rows using detected mapping
    const glRows: GLRow[] = filteredRows.map((row) => {
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
      
      // Parse balance using Indonesian format parser
      const parsedBalance = parseBalance(balanceRaw);
      
      if (!parsedBalance.success) {
        toast.warning(t('intake.notifications.invalidBalance', { account: row[mapping.accountName] || 'Unknown', value: balanceRaw }));
      }

      return {
        accountCode: row[mapping.accountCode] || row[mapping.accountCode?.toLowerCase()] || '',
        accountName: row[mapping.accountName] || row[mapping.accountName?.toLowerCase()] || '',
        balance: parsedBalance.value,
        fsliCode: mapping.fsliCode ? (row[mapping.fsliCode] || row[mapping.fsliCode?.toLowerCase()]) : undefined,
        entityCode: mapping.entityCode ? (row[mapping.entityCode] || row[mapping.entityCode?.toLowerCase()]) : undefined,
        currency: mapping.currency ? (row[mapping.currency] || row[mapping.currency?.toLowerCase()]) : undefined,
        fsliName: (mapping as any).fsliName ? (row[(mapping as any).fsliName] || row[(mapping as any).fsliName?.toLowerCase()]) : undefined,
        noUrut: (mapping as any).noUrut ? parseInt(row[(mapping as any).noUrut] || row[(mapping as any).noUrut?.toLowerCase()] || '0') : 0,
      };
    }).filter(row => {
      return (row.accountName || (row as any).fsliName) && row.balance !== undefined;
    });
    
    // 5. Balance Check
    const totalBalance = glRows.reduce((sum, row) => sum + row.balance, 0);
    const isBalanced = Math.abs(totalBalance) < 0.01;
    setBalanceStatus({ total: totalBalance, isBalanced });

    if (!isBalanced) {
      toast.error(t('intake.notifications.unbalanced'), {
        description: t('intake.notifications.deviation', { 
          deviation: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalBalance) 
        }),
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
    toast.success(t('intake.notifications.success', { count: glRows.length }));
  }, [pmThreshold, onDataImported, t]);

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
          toast.error(t('intake.notifications.parseError', { error: error.message }));
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
  }, [processData, t]);

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
                <h3 className="text-lg font-semibold">{t('intake.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('intake.dropzone.main')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('intake.dropzone.support')}</p>
              </div>
              <Button variant="outline" size="sm">{t('intake.dropzone.button')}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 flex-wrap gap-2 min-w-0">
              <div>
                <CardTitle className="text-xl">{t('intake.results.title')}</CardTitle>
                <CardDescription>
                  {t('intake.results.description', { count: data.length, filename: fileName })}
                  {detectedMapping && (
                    <div className="text-xs mt-1 text-muted-foreground">
                      {t('intake.results.detected', { mapping: Object.entries(detectedMapping).map(([k, v]) => `${k}: ${v}`).join(', ') })}
                    </div>
                  )}
                  {emptyRowCount > 0 && (
                    <div className="text-xs mt-1 text-orange-600">
                      {t('intake.results.filtered', { count: emptyRowCount })}
                    </div>
                  )}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setData([]); setFileName(null); setBenfordData([]); setDetectedMapping(null); setEmptyRowCount(0); }}>
                <X className="h-4 w-4 mr-2" /> {t('intake.results.reset')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-x-auto overflow-y-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint min-w-0 border rounded-md">
                <Table className="min-w-[560px]">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>{t('intake.table.code')}</TableHead>
                      <TableHead>{t('intake.table.name')}</TableHead>
                      <TableHead className="text-right">{t('intake.table.balance')}</TableHead>
                      {data[0]?.fsliCode && <TableHead>{t('intake.table.fsliCode')}</TableHead>}
                      <TableHead>{t('intake.table.significance')}</TableHead>
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
                            <Badge className="bg-orange-500">{t('intake.table.abovePm')}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground opacity-50">{t('intake.table.belowPm')}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={data[0]?.fsliCode ? 5 : 4} className="text-center text-muted-foreground py-4">
                          {t('intake.table.showingFirst50', { count: data.length })}
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
                  {t('intake.integrity.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center flex-wrap gap-2 min-w-0">
                  <span className="text-xs">{t('intake.integrity.balanceCheck')}</span>
                  {balanceStatus?.isBalanced ? (
                    <Badge className="bg-green-600">{t('intake.integrity.balanced')}</Badge>
                  ) : (
                    <Badge variant="destructive">{t('intake.integrity.unbalanced')}</Badge>
                  )}
                </div>
                <div className="mt-2 text-xs font-mono text-right">
                  {t('intake.integrity.total')} {new Intl.NumberFormat('id-ID').format(balanceStatus?.total || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {t('intake.benford.title')}
                </CardTitle>
                <CardDescription className="text-xs">{t('intake.benford.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0 w-full mt-4">
                  <div className="min-w-[320px] h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={benfordData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="digit" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(val) => `${val}%`} />
                      <Tooltip 
                        contentStyle={{ fontSize: '12px' }}
                        formatter={(val: number) => [`${val}%`]}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="actual" name={t('intake.benford.actual')} fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      <Line type="monotone" dataKey="standard" name={t('intake.benford.standard')} stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded bg-muted/30 border text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{t('intake.benford.tip')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
