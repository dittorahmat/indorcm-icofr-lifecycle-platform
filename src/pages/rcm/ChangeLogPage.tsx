import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowRight, User, Calendar, AlertCircle } from 'lucide-react';
import type { ChangeLog } from '@shared/types';

export function ChangeLogPage() {
  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['changelogs'],
    queryFn: () => api<{ items: ChangeLog[] }>('/api/changelogs'),
  });

  const logs = logsData?.items || [];

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold truncate">Change Management Log</h1>
            <p className="text-muted-foreground">Appendix 6 - Illustration of Documentation for Business Process and Control Change Log.</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1 gap-2 border-primary/20 bg-primary/5 self-start sm:self-auto shrink-0">
            <History className="h-3 w-3" /> Audit-Ready
          </Badge>
        </div>

        {error ? (
          <div className="p-8 border-2 border-dashed border-red-200 rounded-lg bg-red-50 text-red-700 flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8" />
            <p className="font-bold">Failed to load change logs</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Master Change Log</CardTitle>
              <CardDescription>Comprehensive record of all structural changes to RCM, BPM, and Control Definitions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Change Detail (Summary)</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Modified By</TableHead>
                    <TableHead>Approval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : logs.length > 0 ? (
                    logs.sort((a, b) => b.timestamp - a.timestamp).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.id.substring(0, 8)}...</TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="bg-slate-50 text-slate-700 p-2 rounded text-xs flex-1 border border-slate-100">
                                <span className="font-bold block uppercase mb-1 opacity-70">Changes:</span>
                                {log.descriptionAfter}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">{log.entityType}</Badge>
                            <div className="text-xs font-mono text-muted-foreground">{log.entityId}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.effectiveDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {log.userId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
                            {log.approvedBy || "System"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No changes have been recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Why is this important?</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                As per **Bab IV Poin 1**, business processes and controls must be reviewed periodically. 
                Any changes caused by external factors (new regulations), personnel turnover, or system updates 
                MUST be identified and documented here to ensure the ICOFR design remains relevant.
              </CardContent>
           </Card>
           <Card className="bg-secondary/5 border-secondary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Link to CSA</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">
                These changes are automatically fed into the **Control Self-Assessment (CSA)** for the current quarter. 
                Line 1 owners will be notified if their controls have been updated to ensure they perform the 
                correct procedures.
              </CardContent>
           </Card>
        </div>
      </div>
    </AppLayout>
  );
}
