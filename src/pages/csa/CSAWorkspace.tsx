import React from 'react';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Control } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
export function CSAWorkspace() {
  const { data: controlsData, isLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <h1 className="text-3xl font-bold mb-6">Control Self-Assessment (CSA)</h1>
            <p className="text-muted-foreground mb-8">
              Complete the self-assessment for your assigned controls for this period.
            </p>
            <div className="space-y-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
              ) : (
                controlsData?.items.map(control => (
                  <Card key={control.id}>
                    <CardHeader>
                      <CardTitle>{control.name}</CardTitle>
                      <CardDescription>{control.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="font-semibold">Is the control operating effectively?</Label>
                        <RadioGroup defaultValue="pass" className="mt-2">
                          <div className="flex items-center space-x-2"><RadioGroupItem value="pass" id={`pass-${control.id}`} /><Label htmlFor={`pass-${control.id}`}>Pass</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="fail" id={`fail-${control.id}`} /><Label htmlFor={`fail-${control.id}`}>Fail</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="na" id={`na-${control.id}`} /><Label htmlFor={`na-${control.id}`}>N/A</Label></div>
                        </RadioGroup>
                      </div>
                      <div>
                        <Label htmlFor={`comments-${control.id}`} className="font-semibold">Comments / Evidence Link</Label>
                        <Textarea id={`comments-${control.id}`} placeholder="Provide comments or a link to evidence..." className="mt-2" />
                      </div>
                      <div className="flex justify-end">
                        <Button>Submit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}