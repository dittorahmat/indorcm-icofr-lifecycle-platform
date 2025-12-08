import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Control, TestRecord } from '@shared/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
const testSchema = z.object({
  testType: z.enum(['TOD', 'TOE']),
  result: z.enum(['Pass', 'Fail']),
  comments: z.string().min(1, 'Comments are required'),
  sampleSize: z.number().optional(),
});
function ControlTestCard({ control }: { control: Control }) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
  });
  const mutation = useMutation({
    mutationFn: (data: Omit<TestRecord, 'id' | 'testDate' | 'testedBy'>) => api('/api/tests', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (data: TestRecord) => {
      toast.success(`${data.testType} for ${control.name} submitted.`);
      if (data.result === 'Fail') {
        queryClient.invalidateQueries({ queryKey: ['deficiencies'] });
      }
      form.reset();
    },
    onError: (error) => {
      toast.error(`Submission failed: ${error.message}`);
    },
  });
  function onSubmit(values: z.infer<typeof testSchema>) {
    mutation.mutate({
      controlId: control.id,
      ...values,
    });
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{control.name}</CardTitle>
        <CardDescription>{control.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tod" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tod">Test of Design</TabsTrigger>
            <TabsTrigger value="toe">Test of Effectiveness</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <TabsContent value="tod" className="pt-6 space-y-4">
                  <h3 className="font-semibold">Design Checklist</h3>
                  <div className="flex items-center space-x-2"><Checkbox id={`tod1-${control.id}`} /><Label htmlFor={`tod1-${control.id}`}>Is the control designed to prevent/detect the risk?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id={`tod2-${control.id}`} /><Label htmlFor={`tod2-${control.id}`}>Is there a clear segregation of duties?</Label></div>
                  <FormField control={form.control} name="comments" render={({ field }) => (
                    <FormItem><FormLabel>Comments</FormLabel><FormControl><Textarea placeholder="Enter TOD comments..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="submit" onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Fail'); }} variant="destructive">Fail</Button>
                    <Button type="submit" onClick={() => { form.setValue('testType', 'TOD'); form.setValue('result', 'Pass'); }}>Pass</Button>
                  </div>
                </TabsContent>
                <TabsContent value="toe" className="pt-6 space-y-4">
                  <h3 className="font-semibold">Sampling</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor={`pop-${control.id}`}>Population Size</Label><Input id={`pop-${control.id}`} type="number" defaultValue="2500" /></div>
                    <FormField control={form.control} name="sampleSize" render={({ field }) => (
                      <FormItem><FormLabel>Sample Size</FormLabel><FormControl><Input type="number" defaultValue="25" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="comments" render={({ field }) => (
                    <FormItem><FormLabel>Comments</FormLabel><FormControl><Textarea placeholder="Enter TOE comments..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="submit" onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Fail'); }} variant="destructive">Fail</Button>
                    <Button type="submit" onClick={() => { form.setValue('testType', 'TOE'); form.setValue('result', 'Pass'); }}>Pass</Button>
                  </div>
                </TabsContent>
              </motion.div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
export function TestWorkbench() {
  const { data: controlsData, isLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });
  const mockRole = localStorage.getItem('mockRole') || 'Line 1';
  if (mockRole !== 'Line 3') {
    return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <MainHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">This workbench is only available to Internal Audit (Line 3).</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <h1 className="text-3xl font-bold mb-2">Testing Workbench</h1>
            <p className="text-muted-foreground mb-8">Perform TOD and TOE for in-scope controls.</p>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : (
                controlsData?.items.map(control => (
                  <AccordionItem value={control.id} key={control.id} className="border-none">
                    <AccordionTrigger className="bg-background p-4 rounded-lg hover:bg-accent transition-colors shadow-sm">
                      <span className="font-semibold">{control.name}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <ControlTestCard control={control} />
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}