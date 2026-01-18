import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, ExternalLink, ShieldCheck, AlertCircle, FileSearch } from 'lucide-react';
import type { SOCReport } from '@shared/types';
import { SOCReviewDialog } from '@/components/audit/SOCReviewDialog';
import { toast } from 'sonner';

const mockSOCs: SOCReport[] = [
  {
    id: "SOC-001",
    vendorName: "Cloud Hosting Corp",
    reportType: "SOC 1 Type 2",
    periodStart: Date.now() - 365 * 24 * 60 * 60 * 1000,
    periodEnd: Date.now() - 5 * 24 * 60 * 60 * 1000,
    issuer: "Audit Global LLP",
    status: "Valid",
    lastValidatedDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    evaluation: {
      scopeAlignment: true,
      periodAlignment: true,
      methodologyAlignment: true,
      hasIneffectiveControls: false,
      compensatingControlsTested: true,
      auditorOpinion: "All key controls are aligned with internal ICOFR requirements."
    }
  },
  {
    id: "SOC-002",
    vendorName: "Payroll Pro Services",
    reportType: "SOC 1 Type 2",
    periodStart: Date.now() - 400 * 24 * 60 * 60 * 1000,
    periodEnd: Date.now() - 200 * 24 * 60 * 60 * 1000,
    issuer: "Local Auditor Co",
    status: "Expired",
    lastValidatedDate: Date.now() - 180 * 24 * 60 * 60 * 1000
  }
];

export function SOCMonitoringPage() {
  const [selectedReport, setSelectedReport] = React.useState<SOCReport | null>(null);

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SOC Monitoring</h1>
            <p className="text-muted-foreground">Monitoring and evaluation of 3rd Party Service Organizations (Bab III.4.3).</p>
          </div>
          <Button className="gap-2">
            <ExternalLink className="h-4 w-4" /> Request Latest Reports
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
           <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-green-800 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Valid Reports
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-900">1</div></CardContent>
           </Card>
           <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Expired / Missing
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-900">1</div></CardContent>
           </Card>
           <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-blue-800 flex items-center gap-2">
                  <Network className="h-4 w-4" /> Total Vendors
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-900">2</div></CardContent>
           </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Organization Control (SOC) Repository</CardTitle>
            <CardDescription>Formal reviu atas laporan asurans pihak ketiga untuk memastikan integritas data pelaporan keuangan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Report Type</TableHead>
                  <TableHead>Coverage Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evaluation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSOCs.map((soc) => (
                  <TableRow key={soc.id}>
                    <TableCell className="font-semibold">{soc.vendorName}</TableCell>
                    <TableCell className="text-xs">{soc.reportType}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(soc.periodStart).toLocaleDateString()} - {new Date(soc.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        soc.status === 'Valid' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                        "bg-red-100 text-red-700 hover:bg-red-100"
                      }>
                        {soc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {soc.evaluation ? (
                        <Badge variant="outline" className="text-[10px] gap-1 border-green-200 text-green-700 bg-green-50">
                          <ShieldCheck className="h-3 w-3" /> Reviewed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1 border-amber-200 text-amber-700 bg-amber-50">
                          <AlertCircle className="h-3 w-3" /> Pending Reviu
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedReport(soc)} className="gap-2">
                        <FileSearch className="h-4 w-4" /> Reviu
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedReport && (
          <SOCReviewDialog 
            report={selectedReport}
            isOpen={!!selectedReport}
            onClose={() => setSelectedReport(null)}
            onSave={(evalData) => {
              toast.success('Evaluation saved successfully for ' + selectedReport.vendorName);
              setSelectedReport(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
