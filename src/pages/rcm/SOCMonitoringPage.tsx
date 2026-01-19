import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, ExternalLink, ShieldCheck, AlertCircle, FileSearch, Plus, Info } from 'lucide-react';
import { api } from '@/lib/api-client';
import { COBIT_ITGC_MAPPING } from '@/lib/compliance-utils';
import type { SOCReport, Application } from '@shared/types';
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

  const { data: appsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications'),
  });

  return (
    <AppLayout container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">IT Monitoring & Assets</h1>
            <p className="text-muted-foreground">Evaluation of 3rd Parties and Significant Applications (Bab III.1.5 & 4.3).</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" /> Request Reports
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Application
            </Button>
          </div>
        </div>

        <Tabs defaultValue="soc">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="soc">SOC Monitoring</TabsTrigger>
            <TabsTrigger value="apps">Significant Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="soc" className="space-y-6 pt-4">
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
          </TabsContent>

          <TabsContent value="apps" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Significant Application Inventory</CardTitle>
                <CardDescription>Inventory of IT assets affecting ICOFR and their ITGC status (Tabel 1).</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application Name</TableHead>
                      <TableHead>Criticality</TableHead>
                      <TableHead>ITGC Status</TableHead>
                      <TableHead>COBIT Focus</TableHead>
                      <TableHead>ITGC Areas (Tabel 1 Mapping)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appsData?.items.map((app) => {
                      const cobitId = "BAI06"; // Mock COBIT ID for mapping visualization
                      const mappedAreas = COBIT_ITGC_MAPPING[cobitId] || [];
                      
                      return (
                        <TableRow key={app.id}>
                          <TableCell className="font-semibold">{app.name}</TableCell>
                          <TableCell>
                            <Badge variant={app.criticality === 'High' ? 'destructive' : 'default'} className="text-[10px]">
                              {app.criticality}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              app.statusITGC === 'Effective' ? "bg-green-100 text-green-700" :
                              app.statusITGC === 'Ineffective' ? "bg-red-100 text-red-700" : "bg-muted"
                            }>
                              {app.statusITGC}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold">{cobitId}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {mappedAreas.map(area => (
                                <Badge key={area} variant="outline" className="text-[8px] bg-blue-50 text-blue-700 border-blue-200 uppercase font-black">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-800 uppercase">Tabel 1 Compliance: COBIT to ITGC Mapping</p>
                <p className="text-[11px] text-blue-700 leading-relaxed italic">
                  Sesuai regulasi SK-5 Tabel 1, setiap kontrol TI (COBIT 2019) dipetakan secara otomatis ke 4 area utama ITGC: 
                  Access to Program & Data, Program Change, Program Development, dan Computer Operations.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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