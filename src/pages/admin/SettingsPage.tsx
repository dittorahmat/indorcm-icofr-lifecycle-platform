import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Settings } from '@shared/types';
import { toast } from 'sonner';
import { 
  Building2, Save, Loader2, Image as ImageIcon, 
  UserCircle, CalendarDays, Lock, ShieldCheck 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export function SettingsPage() {
  const { t } = useTranslation(['common', 'sidebar']);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => api('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success("System settings updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update settings");
    }
  });

  const [localSettings, setLocalSettings] = React.useState<Partial<Settings>>({});

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof Settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  if (isLoading) return <div className="flex h-full items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>;

  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground">Manage organization metadata and regulatory configurations.</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={updateSettingsMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-100"
          >
            {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Global Changes
          </Button>
        </div>

        <div className="grid gap-8">
          {/* 1. Organization Profile */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Organization Profile</CardTitle>
                    <CardDescription>Official name and branding used in reports and BPM diagrams.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Company Name</Label>
                    <Input 
                      value={localSettings.companyName || ''} 
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="e.g. PT. Indonesia GRC Pro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Company Logo URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={localSettings.logoUrl || ''} 
                        onChange={(e) => handleChange('logoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                      <div className="w-10 h-10 border rounded flex items-center justify-center bg-slate-50">
                        {localSettings.logoUrl ? (
                          <img src={localSettings.logoUrl} className="w-8 h-8 object-contain" alt="Preview" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic">Recommended: Transparent PNG, 200x200px</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* 2. Key Personnel */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Authorized Personnel</CardTitle>
                    <CardDescription>Default signatories for Appendix 11 and Management Assessments.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Chief Executive Officer (CEO)</Label>
                    <Input 
                      value={localSettings.ceoName || ''} 
                      onChange={(e) => handleChange('ceoName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Chief Financial Officer (CFO)</Label>
                    <Input 
                      value={localSettings.cfoName || ''} 
                      onChange={(e) => handleChange('cfoName', e.target.value)}
                    />
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* 3. Cycle Control */}
          <Card className="border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-rose-500">
            <CardHeader className="bg-slate-50/50 border-b">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <CardTitle>Compliance Cycle Control</CardTitle>
                       <Badge variant="destructive" className="h-5 px-1.5 text-xs">Critical</Badge>
                    </div>
                    <CardDescription>Manage global fiscal year and period locking.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-rose-900 flex items-center gap-2">
                       {localSettings.isPeriodLocked ? <Lock className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5 text-green-600" />}
                       Period Status: {localSettings.isPeriodLocked ? 'LOCKED' : 'OPEN'}
                    </p>
                    <p className="text-xs text-rose-700/70">When locked, all RCM, Scoping, and Diagram edits are disabled system-wide.</p>
                  </div>
                  <Switch 
                    checked={localSettings.isPeriodLocked} 
                    onCheckedChange={(v) => handleChange('isPeriodLocked', v)} 
                  />
               </div>

               <div className="space-y-2 max-w-[200px]">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Global Fiscal Year</Label>
                  <div className="flex items-center gap-2">
                     <CalendarDays className="h-4 w-4 text-slate-400" />
                     <Input 
                        type="number"
                        value={localSettings.fiscalYear || 2026} 
                        onChange={(e) => handleChange('fiscalYear', parseInt(e.target.value))}
                        className="font-bold"
                     />
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
