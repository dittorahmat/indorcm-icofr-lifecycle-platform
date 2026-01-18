import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, ArrowRight, User, Calendar, FileJson } from 'lucide-react';
import type { ChangeLog } from '@shared/types';

const mockLogs: ChangeLog[] = [
  {
    id: "LOG-001",
    entityId: "CTRL-P2P-01",
    entityType: "Control",
    descriptionBefore: "3-Way Match manual signature by manager",
    descriptionAfter: "3-Way Match automated system approval with exception reporting",
    referenceBefore: "Ver 1.0",
    referenceAfter: "Ver 2.0",
    userId: "USR-002",
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    effectiveDate: Date.now(),
    approvedBy: "CFO-001"
  },
  {
    id: "LOG-002",
    entityId: "PROC-R2R",
    entityType: "RCM",
    descriptionBefore: "Monthly reconciliation within 5 days",
    descriptionAfter: "Monthly reconciliation within 3 days to improve cutoff accuracy",
    referenceBefore: "Standard Operating Procedure V2",
    referenceAfter: "Standard Operating Procedure V3",
    userId: "USR-005",
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
    effectiveDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
    approvedBy: "Head of ICOFR"
  }
];

export function ChangeLogPage() {
  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Change Management Log</h1>
            <p className="text-muted-foreground italic">Lampiran 6 - Ilustrasi Dokumentasi Log Perubahan Proses Bisnis dan Pengendalian.</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1 gap-2 border-primary/20 bg-primary/5">
            <History className="h-3 w-3" /> Audit-Ready
          </Badge>
        </div>

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
                  <TableHead>Change Detail (Before → After)</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Modified By</TableHead>
                  <TableHead>Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-[10px]">{log.id}</TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-red-50 text-red-700 p-2 rounded text-[11px] flex-1 border border-red-100">
                            <span className="font-bold block uppercase mb-1 opacity-70">Before:</span>
                            {log.descriptionBefore}
                            {log.referenceBefore && <div className="mt-1 font-mono italic opacity-60">Ref: {log.referenceBefore}</div>}
                          </div>
                          <div className="mt-4"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                          <div className="bg-green-50 text-green-700 p-2 rounded text-[11px] flex-1 border border-green-100">
                            <span className="font-bold block uppercase mb-1 opacity-70">After:</span>
                            {log.descriptionAfter}
                            {log.referenceAfter && <div className="mt-1 font-mono italic opacity-60">Ref: {log.referenceAfter}</div>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px]">{log.entityType}</Badge>
                        <div className="text-[10px] font-mono text-muted-foreground">{log.entityId}</div>
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
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px]">
                        {log.approvedBy || "System"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
