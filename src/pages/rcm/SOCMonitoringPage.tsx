import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, ShieldCheck, AlertCircle, FileSearch, Plus, Info, Globe, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { SOCReport, Application, Vendor } from '@shared/types';
import { SOCReviewDialog } from '@/components/audit/SOCReviewDialog';
import { AddApplicationDialog } from '@/components/rcm/AddApplicationDialog';
import { AddVendorDialog } from '@/components/audit/AddVendorDialog';
import { AddSOCReportDialog } from '@/components/audit/AddSOCReportDialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { toast } from 'sonner';

import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { PageHeader } from '@/components/layout/PageHeader';

export function SOCMonitoringPage() {
  const { t } = useTranslation(['sidebar', 'rcm', 'scoping', 'common']);
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = React.useState<SOCReport | null>(null);
  const [editingApp, setEditingApp] = React.useState<Application | null>(null);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = React.useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = React.useState(false);
  const [isAddSOCModalOpen, setIsAddSOCModalOpen] = React.useState(false);

  // Protected state if any modal is open
  useUnsavedChanges(isAddAppModalOpen || isAddVendorModalOpen || isAddSOCModalOpen || !!selectedReport || !!editingApp);

  const { data: appsData, isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications'),
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id: string) => 
      api(`/api/applications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success("Application removed from library");
    }
  });

  const { data: socData, isLoading: isLoadingSOC } = useQuery({
    queryKey: ['soc-reports'],
    queryFn: () => api<SOCReport[]>('/api/soc-reports'),
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api<Vendor[]>('/api/vendors'),
  });

  const validReportsCount = socData?.filter(s => s.status === 'Valid').length || 0;
  const expiredReportsCount = socData?.filter(s => s.status === 'Expired').length || 0;

  return (
    <AppLayout container>
      <div className="space-y-6">
        <PageHeader 
          title={t('items.applications', { ns: 'sidebar' }) + " & IT Assets"}
          description="Evaluation of 3rd Parties and Significant Applications (Bab III.1.5 & 4.3)."
        >
          <Button variant="outline" className="gap-2 bg-white" onClick={() => setIsAddVendorModalOpen(true)}>
            <Globe className="h-4 w-4" /> Add Vendor
          </Button>
          <Button variant="outline" className="gap-2 bg-white" onClick={() => setIsAddSOCModalOpen(true)}>
            <ShieldCheck className="h-4 w-4" /> Register SOC
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg" onClick={() => setIsAddAppModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Application
          </Button>
        </PageHeader>

        <Tabs defaultValue="apps">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="apps">Significant Applications</TabsTrigger>
            <TabsTrigger value="soc">SOC Monitoring</TabsTrigger>
          </TabsList>

          {/* TAB 1: APPLICATIONS */}
          <TabsContent value="apps" className="space-y-6 pt-4">
            <Card className="shadow-sm">
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
                      <TableHead>Linked Controls</TableHead>
                      <TableHead>ITGC Areas (Table 1 Mapping)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingApps ? (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
                    ) : !appsData?.items.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                          No applications found. Click "Add Application" to start.
                        </TableCell>
                      </TableRow>
                    ) : appsData.items.map((app) => {
                      const mappedAreas = app.itgcAreas || [];
                      
                      return (
                        <TableRow key={app.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-semibold text-slate-800">
                            {app.name}
                            {app.isSignificant && (
                              <Badge variant="outline" className="ml-2 text-[8px] bg-indigo-50 text-indigo-600 border-indigo-200">SIGNIFICANT</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={app.criticality === 'High' ? 'destructive' : 'default'} className="text-[10px]">
                              {app.criticality}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              app.statusITGC === 'Effective' ? "bg-green-100 text-green-700" :
                              app.statusITGC === 'Ineffective' ? "bg-red-100 text-red-700" : "bg-muted text-slate-500"
                            }>
                              {app.statusITGC || 'Not Tested'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${app.linkedControlCount === 0 ? 'text-destructive' : 'text-slate-600'}`}>
                              {app.linkedControlCount || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <div className="flex gap-1 flex-wrap">
                                {mappedAreas.map(area => (
                                  <Tooltip key={area}>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-[8px] bg-blue-50 text-blue-700 border-blue-200 uppercase font-black cursor-help">
                                        {area.split(' ').map(word => word[0]).join('')}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{area}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {mappedAreas.length === 0 && <span className="text-[10px] text-slate-400 italic">No mapping</span>}
                              </div>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => setEditingApp(app)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-destructive" 
                                onClick={() => {
                                  if (confirm("Remove application from library?")) {
                                    deleteAppMutation.mutate(app.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Table 1 Compliance: COBIT to ITGC Mapping</p>
                <p className="text-[11px] text-blue-700 leading-relaxed italic">
                  In accordance with SK-5 Table 1 regulation, each IT control (COBIT 2019) is automatically mapped to 4 main ITGC areas: 
                  Access to Program & Data, Program Change, Program Development, and Computer Operations.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SOC MONITORING */}
          <TabsContent value="soc" className="space-y-6 pt-4">
            <div className="grid gap-6 md:grid-cols-3">
               <Card className="bg-green-50 border-green-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-green-800 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Valid Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-green-900">{validReportsCount}</div></CardContent>
               </Card>
               <Card className="bg-red-50 border-red-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-red-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Expired / Missing
                    </CardTitle>
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-red-900">{expiredReportsCount}</div></CardContent>
               </Card>
               <Card className="bg-blue-50 border-blue-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-blue-800 flex items-center gap-2">
                      <Network className="h-4 w-4" /> Total Vendors
                    </CardTitle>
                  </CardHeader>
                  <CardContent><div className="text-2xl font-bold text-blue-900">{vendors?.length || 0}</div></CardContent>
               </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Service Organization Control (SOC) Repository</CardTitle>
                <CardDescription>Formal review of third-party assurance reports to ensure financial reporting data integrity.</CardDescription>
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
                    {isLoadingSOC ? (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading SOC data...</TableCell></TableRow>
                    ) : !socData?.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                          No SOC reports found. Register a vendor and report to begin.
                        </TableCell>
                      </TableRow>
                    ) : socData.map((soc) => (
                      <TableRow key={soc.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-800">{soc.vendorName}</TableCell>
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
                          {soc.evaluation?.id ? (
                            <Badge variant="outline" className="text-[10px] gap-1 border-green-200 text-green-700 bg-green-50">
                              <ShieldCheck className="h-3 w-3" /> Reviewed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-1 border-amber-200 text-amber-700 bg-amber-50">
                              <AlertCircle className="h-3 w-3" /> Pending Review
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(soc)} className="gap-2 text-indigo-600 hover:bg-indigo-50">
                            <FileSearch className="h-4 w-4" /> Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedReport && (
          <SOCReviewDialog 
            report={selectedReport}
            isOpen={!!selectedReport}
            onClose={() => setSelectedReport(null)}
            onSave={() => {
              setSelectedReport(null);
            }}
          />
        )}

        <AddApplicationDialog 
          isOpen={isAddAppModalOpen || !!editingApp}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddAppModalOpen(false);
              setEditingApp(null);
            } else {
              setIsAddAppModalOpen(true);
            }
          }}
          initialData={editingApp}
        />

        <AddVendorDialog 
          isOpen={isAddVendorModalOpen}
          onOpenChange={setIsAddVendorModalOpen}
        />

        <AddSOCReportDialog 
          isOpen={isAddSOCModalOpen}
          onOpenChange={setIsAddSOCModalOpen}
        />
      </div>
    </AppLayout>
  );
}
