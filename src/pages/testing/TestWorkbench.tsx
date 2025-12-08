import React from 'react';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
export function TestWorkbench() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <h1 className="text-3xl font-bold mb-6">Testing Workbench</h1>
            <p className="text-muted-foreground mb-8">
              Perform Test of Design (TOD) and Test of Operating Effectiveness (TOE) for in-scope controls.
            </p>
            <Card>
              <CardHeader>
                <CardTitle>P2P-01: 3-Way Match</CardTitle>
                <CardDescription>Vendor invoice is matched against purchase order and goods receipt note before payment.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tod">
                  <TabsList>
                    <TabsTrigger value="tod">Test of Design</TabsTrigger>
                    <TabsTrigger value="toe">Test of Effectiveness</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tod" className="pt-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Design Checklist</h3>
                      <div className="flex items-center space-x-2"><Checkbox id="tod1" /><Label htmlFor="tod1">Is the control designed to prevent or detect the risk?</Label></div>
                      <div className="flex items-center space-x-2"><Checkbox id="tod2" /><Label htmlFor="tod2">Is there a clear segregation of duties?</Label></div>
                      <div className="flex items-center space-x-2"><Checkbox id="tod3" /><Label htmlFor="tod3">Is the control automated or manual?</Label></div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="destructive">Fail</Button>
                        <Button>Pass</Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="toe" className="pt-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Sampling</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="population">Population Size</Label><Input id="population" defaultValue="2500" /></div>
                        <div className="space-y-2"><Label htmlFor="sample">Sample Size</Label><Input id="sample" defaultValue="25" /></div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="destructive">Fail</Button>
                        <Button>Pass</Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}