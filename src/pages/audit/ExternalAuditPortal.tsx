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

  const handleSubmitOpinion = () => {
    toast.success('Opini Atestasi berhasil diserahkan.', {
      description: 'Laporan audit independen telah dikunci dan dikirim ke Komite Audit.'
    });
  };

  const mockRole = localStorage.getItem('mockRole');

  if (mockRole !== 'External Auditor') {
    return (
      <AppLayout container>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <Lock className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Restricted Access</h1>
          <p className="text-muted-foreground">Portal ini khusus untuk Praktisi Eksternal (KAP) sesuai Bab VIII SK-5.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">KAP Portal</Badge>
              <span className="text-xs text-muted-foreground">SK-5 Bab VIII: Atestasi Eksternal</span>
            </div>
            <h1 className="text-3xl font-bold">Independent Assurance Portal</h1>
            <p className="text-muted-foreground">Reviu Asesmen Manajemen dan Kertas Kerja Audit Internal.</p>
          </div>
          <Button onClick={handleSubmitOpinion} className="gap-2">
            <Briefcase className="h-4 w-4" /> Submit Audit Opinion
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Management Conclusion</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">Effective</div>
              <p className="text-xs text-muted-foreground">Per Management Assessment Report</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Open Deficiencies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData?.openDeficiencies || 0}</div>
              <p className="text-xs text-muted-foreground">Findings pending remediation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scope Coverage</CardTitle>
              <FileCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">Of Material Accounts & Processes</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="review">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="review">1. Reviu Kertas Kerja</TabsTrigger>
            <TabsTrigger value="opinion">2. Opini Audit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="review" className="pt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Management Assessment Review</CardTitle>
                <CardDescription>Evaluasi atas asersi manajemen mengenai efektivitas pengendalian internal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/30 rounded-lg border text-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold">Laporan Asesmen Manajemen</span>
                    <Button variant="link" size="sm">View Document</Button>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold">RCM & Desain Kontrol</span>
                    <Button variant="link" size="sm">View Matrix</Button>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold">Hasil Pengujian (Lini 3)</span>
                    <Button variant="link" size="sm">View Working Papers</Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Berita Acara Remediasi</span>
                    <Button variant="link" size="sm">View Evidence</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opinion" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Independent Auditor's Report</CardTitle>
                <CardDescription>Pernyataan pendapat atas efektivitas pengendalian internal pelaporan keuangan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Opini Audit</label>
                  <select className="w-full p-2 border rounded-md bg-background">
                    <option>Wajar Tanpa Pengecualian (Unqualified Opinion)</option>
                    <option>Wajar Dengan Pengecualian (Qualified Opinion)</option>
                    <option>Tidak Wajar (Adverse Opinion)</option>
                    <option>Menolak Memberikan Pendapat (Disclaimer)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Basis Opini & Catatan Penting</label>
                  <Textarea placeholder="Jelaskan dasar opini dan temuan audit utama..." className="min-h-[150px]" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
