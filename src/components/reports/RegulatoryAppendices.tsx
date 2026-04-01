import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, Info, History, ClipboardCheck, LayoutGrid, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

import { MOCK_ELC, MOCK_TLC, MOCK_FINDINGS, MOCK_DOD, MOCK_CHANGELOG, MOCK_COMPANY } from './mock-regulatory-data';

export function RegulatoryAppendices() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex-1">
          <Info className="h-4 w-4" />
          <p className="font-medium">SIMULATION MODE: Displaying standardized mockup data for <strong>{MOCK_COMPANY}</strong> as per SK-5/2024 Appendices.</p>
        </div>
      </div>

      <Tabs defaultValue="rcm-tlc" className="flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-col h-auto bg-transparent border-r rounded-none p-0 items-start min-w-[200px]">
          <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Risk Control Matrix</div>
          <TabsTrigger value="rcm-elc" className="w-full justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2">
            <ShieldCheck className="h-4 w-4 mr-2" /> ELC (Lampiran 5a)
          </TabsTrigger>
          <TabsTrigger value="rcm-tlc" className="w-full justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2">
            <LayoutGrid className="h-4 w-4 mr-2" /> TLC (Lampiran 5b)
          </TabsTrigger>
          <TabsTrigger value="rcm-itgc" className="w-full justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2">
            <Info className="h-4 w-4 mr-2" /> ITGC (Lampiran 5c)
          </TabsTrigger>
          
          <div className="px-4 py-2 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Findings & DoD</div>
          <TabsTrigger value="findings" className="w-full justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2">
            <AlertCircle className="h-4 w-4 mr-2" /> Temuan (Lampiran 9)
          </TabsTrigger>
          <TabsTrigger value="dod" className="w-full justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2">
            <LayoutGrid className="h-4 w-4 mr-2" /> DoD (Lampiran 10)
          </TabsTrigger>

          <div className="px-4 py-2 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Governance</div>
          <TabsTrigger value="changelog" className="w-full justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2">
            <History className="h-4 w-4 mr-2" /> Log Perubahan (Lmp 6)
          </TabsTrigger>
          <TabsTrigger value="csa-doc" className="w-full justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2">
            <ClipboardCheck className="h-4 w-4 mr-2" /> Dok. CSA (Lampiran 7)
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="rcm-elc" className="m-0">
            <ELCReport />
          </TabsContent>
          <TabsContent value="rcm-tlc" className="m-0">
            <TLCReport />
          </TabsContent>
          <TabsContent value="rcm-itgc" className="m-0">
            <ITGCReport />
          </TabsContent>
          <TabsContent value="findings" className="m-0">
            <FindingsReport />
          </TabsContent>
          <TabsContent value="dod" className="m-0">
            <DoDReport />
          </TabsContent>
          <TabsContent value="changelog" className="m-0">
            <ChangeLogReport />
          </TabsContent>
          <TabsContent value="csa-doc" className="m-0">
            <CSADocReport />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ReportCard({ title, description }: { title: string, description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/30">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium italic">Building visualization from Template Report.xlsx...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ELCReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran 5a: RCM ELC</CardTitle>
        <CardDescription>Entity Level Control Matrix - {MOCK_COMPANY}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold w-[100px]">Ref</TableHead>
                <TableHead className="text-[10px] uppercase font-bold w-[300px]">Aktivitas Pengendalian</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Frekuensi</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Fungsi Pelaksana</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">COSO Mapping</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ELC.map((item) => (
                <TableRow key={item.ref} className="text-xs">
                  <TableCell className="font-mono font-bold text-primary">{item.ref}</TableCell>
                  <TableCell className="leading-relaxed">{item.activity}</TableCell>
                  <TableCell>{item.freq}</TableCell>
                  <TableCell>{item.function}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground italic">{item.coso}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function TLCReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran 5b: RCM TLC</CardTitle>
        <CardDescription>Transaction Level Control Matrix - Mining Operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold">Process Context</TableHead>
                <TableHead className="text-[10px] uppercase font-bold w-[250px]">Risiko</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Control Reference</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Asersi</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Nature</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Affected FSLI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TLC.map((item) => (
                <TableRow key={item.controlRef} className="text-xs">
                  <TableCell>
                    <p className="font-bold text-blue-800">{item.process}</p>
                    <p className="text-[10px] text-slate-500 italic">{item.subProcess}</p>
                  </TableCell>
                  <TableCell className="leading-tight text-slate-600 italic">"{item.risk}"</TableCell>
                  <TableCell>
                    <p className="font-bold">{item.controlRef}</p>
                    <p className="text-[10px] line-clamp-2">{item.controlName}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-0.5">
                      {item.assertions.map(a => <Badge key={a} variant="outline" className="text-[8px] px-1 h-4">{a}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-[9px] uppercase font-bold">{item.nature}</Badge>
                    <p className="text-[8px] mt-0.5 text-muted-foreground">{item.natureExecution}</p>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{item.affectedFSLI}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ITGCReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran 5c: RCM ITGC</CardTitle>
        <CardDescription>IT General Control Matrix - ERP & Systems</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground italic font-medium">ITGC Data Visualizing from SAP/Oracle Mapping...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FindingsReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran 9: Format Daftar Temuan</CardTitle>
        <CardDescription>Audit Findings & Remediation Tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold">Judul Observasi</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Akun Terdampak</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Exposure</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Tipe Defisiensi</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Rencana Remediasi</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_FINDINGS.map((item) => (
                <TableRow key={item.ref} className="text-xs">
                  <TableCell>
                    <p className="font-bold text-red-700">{item.ref}</p>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{item.detail}</p>
                  </TableCell>
                  <TableCell>{item.account}</TableCell>
                  <TableCell className="font-mono font-bold text-red-600 text-[10px]">Rp {item.exposure.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] border-amber-200 text-amber-700 bg-amber-50">{item.type}</Badge></TableCell>
                  <TableCell className="italic text-slate-600 text-[10px]">{item.remediation}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge className={cn(item.conclusion === 'Efektif' ? "bg-green-600" : "bg-red-600")}>
                        {item.conclusion || 'Tidak Efektif'}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground uppercase font-bold text-center">{item.status}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DoDReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran 10: Penentuan DOD</CardTitle>
        <CardDescription>Logic-based Deficiency Classification (Box 1-7)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold">Ref</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">B1: Asersi</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">B2: Likelihood</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">B3: Magnitude</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">B5: Compensating</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Kesimpulan Akhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DOD.map((item) => (
                <TableRow key={item.ref} className="text-xs">
                  <TableCell className="font-bold">{item.ref}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600">{item.box1}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600">{item.box2}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600">{item.box3}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600">{item.box5}</TableCell>
                  <TableCell><Badge variant="destructive" className="font-black text-[11px] px-4">{item.conclusion}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangeLogReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran 6: Log Perubahan Bisnis</CardTitle>
        <CardDescription>Audit Trail of Control Design Evolution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold">Proses</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Sebelum Perubahan</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Sesudah Perubahan</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Effective Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CHANGELOG.map((item) => (
                <TableRow key={item.no} className="text-xs">
                  <TableCell className="font-bold">{item.process}</TableCell>
                  <TableCell className="text-slate-500 italic">"{item.before}"<br/><span className="text-[9px] font-mono font-bold uppercase">{item.refBefore}</span></TableCell>
                  <TableCell className="font-medium">"{item.after}"<br/><span className="text-[9px] font-mono font-bold text-blue-700 uppercase">{item.refAfter}</span></TableCell>
                  <TableCell className="font-bold">{item.effective}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CSADocReport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran 7: Dokumentasi CSA</CardTitle>
        <CardDescription>Detailed Control Self-Assessment Documentation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-8 border-2 border-slate-100 bg-slate-50/50 rounded-lg text-center">
          <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium italic">Standardized CSA Documentation Header (Lampiran 7) mapped to Internal Action Portal.</p>
        </div>
      </CardContent>
    </Card>
  );
}
