import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, FileCheck, AlertTriangle, Briefcase, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function ExternalAuditPortal() {
  const { data: summaryData } = useQuery({
    queryKey: ['reportSummary'],
    queryFn: () => api<any>('/api/reports/summary'),
  });

  const [opinionType, setOpinionType] = React.useState("Wajar Tanpa Pengecualian (Unqualified Opinion)");
  const [basisOpinion, setBasisOpinion] = React.useState("");

  const handleSubmitOpinion = () => {
    toast.success('Attestation Opinion successfully submitted.', {
      description: `Opinion: ${opinionType}. The independent audit report has been locked and sent to the Audit Committee.`
    });
  };

  const mockRole = localStorage.getItem('mockRole');

  if (mockRole !== 'External Auditor') {
    return (
      <AppLayout container>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <Lock className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Restricted Access</h1>
          <p className="text-muted-foreground">This portal is specifically for External Practitioners (KAP) in accordance with Chapter VIII of SK-5.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout container>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 flex-wrap min-w-0 max-w-full">
          <div className="min-w-0 max-w-full">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">KAP Portal</Badge>
              <span className="text-xs text-muted-foreground">SK-5 Chapter VIII: External Attestation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Independent Assurance Portal</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Review of Management Assessment and Internal Audit Working Papers.</p>
          </div>
          <Button onClick={handleSubmitOpinion} className="w-full sm:w-auto gap-2 h-11 sm:h-10 min-h-[44px] sm:min-h-0 shrink-0">
            <Briefcase className="h-4 w-4" /> Submit Audit Opinion
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap pb-2 gap-2 min-w-0 max-w-full">
              <CardTitle className="text-sm font-medium min-w-0 truncate">Management Conclusion</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">Effective</div>
              <p className="text-xs text-muted-foreground">Per Management Assessment Report</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap pb-2 gap-2 min-w-0 max-w-full">
              <CardTitle className="text-sm font-medium min-w-0 truncate">Open Deficiencies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData?.openDeficiencies || 0}</div>
              <p className="text-xs text-muted-foreground">Findings pending remediation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap pb-2 gap-2 min-w-0 max-w-full">
              <CardTitle className="text-sm font-medium min-w-0 truncate">Scope Coverage</CardTitle>
              <FileCheck className="h-4 w-4 text-blue-600 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">Of Material Accounts & Processes</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="review">
          <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar -mx-1 px-1">
          <TabsList className="flex w-max min-w-full sm:w-auto sm:inline-flex justify-start gap-1 min-h-[44px]">
            <TabsTrigger value="review" className="px-4 text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none whitespace-nowrap min-w-[140px] sm:min-w-0 flex items-center justify-center">1. Working Paper Review</TabsTrigger>
            <TabsTrigger value="opinion" className="px-4 text-xs sm:text-sm min-h-[44px] flex-1 sm:flex-none whitespace-nowrap min-w-[140px] sm:min-w-0 flex items-center justify-center">2. Audit Opinion</TabsTrigger>
          </TabsList>
          </div>
          
          <TabsContent value="review" className="pt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Management Assessment Review</CardTitle>
                <CardDescription>Evaluation of management assertions regarding internal control effectiveness.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/30 rounded-lg border text-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                    <span className="font-semibold">Management Assessment Report</span>
                    <Button variant="link" size="sm">View Document</Button>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                    <span className="font-semibold">RCM & Control Design</span>
                    <Button variant="link" size="sm">View Matrix</Button>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                    <span className="font-semibold">Testing Results (Line 3)</span>
                    <Button variant="link" size="sm">View Working Papers</Button>
                  </div>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="font-semibold">Remediation Minutes</span>
                    <Button variant="link" size="sm">View Evidence</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opinion" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Draft Independent Auditor's Opinion</CardTitle>
                  <CardDescription>Statement of opinion on the effectiveness of internal control over financial reporting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Opinion Type</label>
                    <select 
                      className="w-full p-2 min-h-[44px] border rounded-md bg-background text-base sm:text-sm"
                      value={opinionType}
                      onChange={(e) => setOpinionType(e.target.value)}
                    >
                      <option value="Wajar Tanpa Pengecualian (Unqualified Opinion)">Unqualified Opinion</option>
                      <option value="Wajar Dengan Pengecualian (Qualified Opinion)">Qualified Opinion</option>
                      <option value="Tidak Wajar (Adverse Opinion)">Adverse Opinion</option>
                      <option value="Menolak Memberikan Pendapat (Disclaimer)">Disclaimer of Opinion</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Basis for Opinion & Key Audit Matters</label>
                    <Textarea 
                      placeholder="Describe the basis for opinion and key audit findings..." 
                      className="min-h-[150px] text-base sm:text-sm" 
                      value={basisOpinion}
                      onChange={(e) => setBasisOpinion(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-800">Auditor's Report Preview</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-700 space-y-4 font-sans font-medium leading-relaxed">
                  <p className="font-bold text-center uppercase">Independent Auditor's Report</p>
                  <p>To the Shareholders and Board of Commissioners of PT [Company Name]</p>
                  <p>
                    We have audited the internal control over financial reporting of PT [Company Name] as of [Date], based on criteria established in <span className="font-semibold not-italic">Internal Control - Integrated Framework</span> issued by the <span className="font-semibold not-italic">Committee of Sponsoring Organizations of the Treadway Commission (COSO)</span>.
                  </p>
                  <p className="font-bold underline">Opinion</p>
                  <p>
                    In our opinion, PT [Company Name] {opinionType === "Wajar Tanpa Pengecualian (Unqualified Opinion)" ? "maintained, in all material respects, effective internal control" : "did not maintain effective internal control"} over financial reporting as of [Date], based on COSO criteria.
                  </p>
                  {basisOpinion && (
                    <>
                      <p className="font-bold underline">Basis for Opinion</p>
                      <p>{basisOpinion}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
