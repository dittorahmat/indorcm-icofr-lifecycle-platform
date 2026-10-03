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
  UserCircle, CalendarDays, Lock, ShieldCheck, Mail,
  Webhook, Send, Radio
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const [testingEmail, setTestingEmail] = React.useState(false);
  const [testingWebhook, setTestingWebhook] = React.useState<string | null>(null);

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await api('/api/settings/test-email', {
        method: 'POST',
        body: JSON.stringify(localSettings),
      });
      toast.success(t('emailSettings.testSuccess'));
    } catch (err: any) {
      toast.error(err.message || t('emailSettings.testError'));
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestWebhook = async (provider: 'slack' | 'msTeams' | 'generic', url?: string) => {
    if (!url) {
      toast.error(t('webhookSettings.testError') + ': URL is required');
      return;
    }
    setTestingWebhook(provider);
    try {
      await api('/api/settings/test-webhook', {
        method: 'POST',
        body: JSON.stringify({ provider, webhookUrl: url }),
      });
      toast.success(t('webhookSettings.testSuccess'));
    } catch (err: any) {
      toast.error(err.message || t('webhookSettings.testError'));
    } finally {
      setTestingWebhook(null);
    }
  };
  const handleSave = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  if (isLoading) return <div className="flex h-full items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>;

  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight truncate">System Settings</h1>
            <p className="text-muted-foreground">Manage organization metadata and regulatory configurations.</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={updateSettingsMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-100 w-full sm:w-auto min-h-[44px] shrink-0"
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <p className="text-xs text-slate-400">Recommended: Transparent PNG, 200x200px</p>
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Email Notification Settings */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
               <div className="flex items-center justify-between flex-wrap gap-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{t('emailSettings.title')}</CardTitle>
                      <CardDescription>{t('emailSettings.description')}</CardDescription>
                    </div>
                 </div>
                 {localSettings.emailProvider === 'smtp' && (
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="sm" 
                     disabled={testingEmail}
                     onClick={handleTestEmail}
                     className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                   >
                     {testingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                     {t('emailSettings.testConnection')}
                   </Button>
                 )}
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('emailSettings.provider')}</Label>
                    <Select 
                      value={localSettings.emailProvider || 'system'} 
                      onValueChange={(val) => handleChange('emailProvider', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('placeholders.choose')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">{t('emailSettings.systemDefault')}</SelectItem>
                        <SelectItem value="smtp">{t('emailSettings.customSmtp')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('emailSettings.senderName')}</Label>
                    <Input 
                      value={localSettings.senderName || ''} 
                      onChange={(e) => handleChange('senderName', e.target.value)}
                      placeholder="e.g. IndoGRC Pro Notifications"
                      disabled={localSettings.emailProvider === 'system'}
                    />
                  </div>
               </div>

               {localSettings.emailProvider === 'smtp' && (
                 <>
                   <Separator className="my-4" />
                   <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2 md:col-span-2">
                         <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('emailSettings.senderEmail')}</Label>
                         <Input 
                           type="email"
                           value={localSettings.senderEmail || ''} 
                           onChange={(e) => handleChange('senderEmail', e.target.value)}
                           placeholder="info@dsintegra.co.id"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('emailSettings.smtpPort')}</Label>
                         <Input 
                           type="number"
                           value={localSettings.smtpPort || 587} 
                           onChange={(e) => handleChange('smtpPort', parseInt(e.target.value) || 587)}
                           placeholder="587"
                         />
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2 md:col-span-2">
                         <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('emailSettings.smtpHost')}</Label>
                         <Input 
                           value={localSettings.smtpHost || ''} 
                           onChange={(e) => handleChange('smtpHost', e.target.value)}
                           placeholder="e.g. mail.dsintegra.co.id"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('emailSettings.smtpSecurity')}</Label>
                         <div className="text-sm font-semibold py-2.5 text-slate-600">
                           {localSettings.smtpPort === 465 ? t('emailSettings.ssl') : (localSettings.smtpPort === 587 ? t('emailSettings.starttls') : t('emailSettings.unencrypted'))}
                         </div>
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('emailSettings.smtpUser')}</Label>
                         <Input 
                           value={localSettings.smtpUser || ''} 
                           onChange={(e) => handleChange('smtpUser', e.target.value)}
                           placeholder="e.g. SMTP username or full email address"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">{t('emailSettings.smtpPass')}</Label>
                         <Input 
                           type="password"
                           value={localSettings.smtpPass || ''} 
                           onChange={(e) => handleChange('smtpPass', e.target.value)}
                           placeholder="••••••••••••"
                         />
                       </div>
                     </div>
                   </div>
                 </>
               )}
            </CardContent>
          </Card>

          {/* Webhook & Multi-Channel Integrations */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
               <div className="flex items-center justify-between flex-wrap gap-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
                      <Webhook className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{t('webhookSettings.title')}</CardTitle>
                      <CardDescription>{t('webhookSettings.description')}</CardDescription>
                    </div>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               {/* 1. Slack Webhook */}
               <div className="p-4 border rounded-lg bg-slate-50/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{t('webhookSettings.slackTitle')}</h4>
                      <p className="text-xs text-slate-500">{t('webhookSettings.slackDesc')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={localSettings.slackEnabled || false} 
                        onCheckedChange={(val) => handleChange('slackEnabled', val)} 
                      />
                      <Badge variant={localSettings.slackEnabled ? "default" : "outline"} className="text-xs">
                        {localSettings.slackEnabled ? t('webhookSettings.enabled') : t('webhookSettings.disabled')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <Input 
                      value={localSettings.slackWebhookUrl || ''} 
                      onChange={(e) => handleChange('slackWebhookUrl', e.target.value)}
                      placeholder={t('webhookSettings.slackPlaceholder')}
                      className="font-mono text-base sm:text-xs h-11 sm:h-10 min-h-[44px] sm:min-h-0 min-w-0 flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={testingWebhook === 'slack' || !localSettings.slackWebhookUrl}
                      onClick={() => handleTestWebhook('slack', localSettings.slackWebhookUrl)}
                      className="gap-2 shrink-0 border-sky-200 text-sky-700 hover:bg-sky-50 h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center"
                    >
                      {testingWebhook === 'slack' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {t('webhookSettings.testWebhook')}
                    </Button>
                  </div>
               </div>

               {/* 2. Microsoft Teams Webhook */}
               <div className="p-4 border rounded-lg bg-slate-50/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{t('webhookSettings.teamsTitle')}</h4>
                      <p className="text-xs text-slate-500">{t('webhookSettings.teamsDesc')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={localSettings.msTeamsEnabled || false} 
                        onCheckedChange={(val) => handleChange('msTeamsEnabled', val)} 
                      />
                      <Badge variant={localSettings.msTeamsEnabled ? "default" : "outline"} className="text-xs">
                        {localSettings.msTeamsEnabled ? t('webhookSettings.enabled') : t('webhookSettings.disabled')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <Input 
                      value={localSettings.msTeamsWebhookUrl || ''} 
                      onChange={(e) => handleChange('msTeamsWebhookUrl', e.target.value)}
                      placeholder={t('webhookSettings.teamsPlaceholder')}
                      className="font-mono text-base sm:text-xs h-11 sm:h-10 min-h-[44px] sm:min-h-0 min-w-0 flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={testingWebhook === 'msTeams' || !localSettings.msTeamsWebhookUrl}
                      onClick={() => handleTestWebhook('msTeams', localSettings.msTeamsWebhookUrl)}
                      className="gap-2 shrink-0 border-sky-200 text-sky-700 hover:bg-sky-50 h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center"
                    >
                      {testingWebhook === 'msTeams' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {t('webhookSettings.testWebhook')}
                    </Button>
                  </div>
               </div>

               {/* 3. Generic Webhook */}
               <div className="p-4 border rounded-lg bg-slate-50/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{t('webhookSettings.genericTitle')}</h4>
                      <p className="text-xs text-slate-500">{t('webhookSettings.genericDesc')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={localSettings.genericWebhookEnabled || false} 
                        onCheckedChange={(val) => handleChange('genericWebhookEnabled', val)} 
                      />
                      <Badge variant={localSettings.genericWebhookEnabled ? "default" : "outline"} className="text-xs">
                        {localSettings.genericWebhookEnabled ? t('webhookSettings.enabled') : t('webhookSettings.disabled')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <Input 
                      value={localSettings.genericWebhookUrl || ''} 
                      onChange={(e) => handleChange('genericWebhookUrl', e.target.value)}
                      placeholder={t('webhookSettings.genericPlaceholder')}
                      className="font-mono text-base sm:text-xs h-11 sm:h-10 min-h-[44px] sm:min-h-0 min-w-0 flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      disabled={testingWebhook === 'generic' || !localSettings.genericWebhookUrl}
                      onClick={() => handleTestWebhook('generic', localSettings.genericWebhookUrl)}
                      className="gap-2 shrink-0 border-sky-200 text-sky-700 hover:bg-sky-50 h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center"
                    >
                      {testingWebhook === 'generic' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {t('webhookSettings.testWebhook')}
                    </Button>
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
               <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-lg border border-rose-100 flex-wrap gap-2">
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
