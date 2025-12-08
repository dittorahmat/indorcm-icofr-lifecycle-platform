import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainHeader } from '@/components/layout/MainHeader';
import { api } from '@/lib/api-client';
import type { RCM, Control } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ControlEditor } from '@/components/rcm/ControlEditor';
import { motion } from 'framer-motion';
export function RCMList() {
  const [selectedControl, setSelectedControl] = React.useState<Control | null>(null);
  const [isEditorOpen, setEditorOpen] = React.useState(false);
  const { data: rcmData, isLoading: rcmLoading } = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: RCM[] }>('/api/rcm'),
  });
  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });
  const controlsByRcmId = React.useMemo(() => {
    if (!controlsData) return {};
    return controlsData.items.reduce((acc, control) => {
      (acc[control.rcmId] = acc[control.rcmId] || []).push(control);
      return acc;
    }, {} as Record<string, Control[]>);
  }, [controlsData]);
  const handleEditControl = (control: Control) => {
    setSelectedControl(control);
    setEditorOpen(true);
  };
  const handleAddNewControl = (rcmId: string) => {
    const newControl: Partial<Control> = { rcmId, name: "New Control", description: "", assertions: [] };
    setSelectedControl(newControl as Control);
    setEditorOpen(true);
  };
  const isLoading = rcmLoading || controlsLoading;
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <MainHeader />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Risk Control Matrix (RCM)</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline"><FileDown className="h-4 w-4 mr-2" /> Export</Button>
                <Button><PlusCircle className="h-4 w-4 mr-2" /> Add Process</Button>
              </div>
            </div>
            <div className="mb-6">
              <Input placeholder="Search controls or risks..." className="max-w-sm" />
            </div>
            <motion.div
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
              ) : (
                rcmData?.items.map(rcm => (
                  <motion.div key={rcm.id} variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{rcm.process}: {rcm.subProcess}</CardTitle>
                        <CardDescription><strong>Risk:</strong> {rcm.riskDescription}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(controlsByRcmId[rcm.id] || []).map(control => (
                            <div key={control.id} className="border p-4 rounded-md flex justify-between items-start bg-background hover:bg-muted/50 transition-colors">
                              <div>
                                <h4 className="font-semibold">{control.name}</h4>
                                <p className="text-sm text-muted-foreground">{control.description}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleEditControl(control)}>Edit</Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => handleAddNewControl(rcm.id)}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Add Control
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <ControlEditor
        isOpen={isEditorOpen}
        setIsOpen={setEditorOpen}
        control={selectedControl}
      />
    </div>
  );
}