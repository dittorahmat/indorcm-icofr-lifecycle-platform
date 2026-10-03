import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import { 
  Bell as BellIcon, 
  Megaphone,
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Trash2, 
  CheckCheck,
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { UserNotificationPreferences } from '@shared/types';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  readStatus: boolean;
  createdAt: string;
  title?: string;
  link?: string;
}

export function NotificationsPage() {
  const { t } = useTranslation(['csa_hub', 'common']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showPreferences, setShowPreferences] = React.useState(false);

  const { data: userPreferences, isLoading: isPrefsLoading } = useQuery<UserNotificationPreferences>({
    queryKey: ['user-notification-preferences'],
    queryFn: () => api<UserNotificationPreferences>('/api/users/me/notification-preferences'),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (newPrefs: Partial<UserNotificationPreferences>) => api('/api/users/me/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify(newPrefs),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notification-preferences'] });
      toast.success(t('common:webhookSettings.preferencesSaved'));
    },
    onError: () => {
      toast.error("Failed to update notification preferences");
    }
  });

  const [localPrefs, setLocalPrefs] = React.useState<UserNotificationPreferences>({
    inApp: true,
    email: true,
    slack: true,
    msTeams: true,
    genericWebhook: true,
  });

  React.useEffect(() => {
    if (userPreferences) {
      setLocalPrefs(userPreferences);
    }
  }, [userPreferences]);

  const handleTogglePref = (channel: keyof UserNotificationPreferences, value: boolean) => {
    const updated = { ...localPrefs, [channel]: value };
    setLocalPrefs(updated);
    updatePreferencesMutation.mutate(updated);
  };

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-full'],
    queryFn: () => api<Notification[]>('/api/notifications'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api(`/api/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-full'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-full'] });
      toast.success(t('notifications.markAllRead'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-full'] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api('/api/notifications', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-full'] });
      toast.success(t('notifications.clearAll'));
    },
  });

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-rose-500" />;
      default: return <Info className="h-5 w-5 text-indigo-500" />;
    }
  };

  const sortedNotifications = React.useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

  return (
    <AppLayout container>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="bg-indigo-100 p-2.5 rounded-xl">
                <Megaphone className="h-7 w-7 text-indigo-600" />
              </div>
              {t('notifications.title')}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {t('notifications.description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showPreferences ? "default" : "outline"}
              size="sm" 
              className={cn(
                "font-bold text-xs uppercase tracking-wider gap-2 h-9",
                showPreferences ? "bg-indigo-600 hover:bg-indigo-700" : ""
              )}
              onClick={() => setShowPreferences(!showPreferences)}
            >
              <Sliders className="h-3.5 w-3.5" />
              {t('common:webhookSettings.userPreferencesTitle')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="font-bold text-xs uppercase tracking-wider gap-2 h-9"
              onClick={() => markAllReadMutation.mutate()}
              disabled={!sortedNotifications.length || markAllReadMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t('notifications.markAllRead')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="font-bold text-xs uppercase tracking-wider gap-2 h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => clearAllMutation.mutate()}
              disabled={!sortedNotifications.length || clearAllMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('notifications.clearAll')}
            </Button>
          </div>
        </div>

        {/* User Notification Channel Preferences Card */}
        {showPreferences && (
          <Card className="border-indigo-100 bg-indigo-50/20 shadow-md">
            <CardHeader className="pb-3 border-b border-indigo-100/50">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-600" />
                {t('common:webhookSettings.userPreferencesTitle')}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {t('common:webhookSettings.userPreferencesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {/* 1. In-App */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t('common:webhookSettings.inApp')}</p>
                    <p className="text-xs text-slate-500">{t('common:webhookSettings.inAppDesc')}</p>
                  </div>
                  <Switch 
                    checked={localPrefs.inApp} 
                    onCheckedChange={(val) => handleTogglePref('inApp', val)}
                  />
                </div>

                {/* 2. Email */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t('common:webhookSettings.email')}</p>
                    <p className="text-xs text-slate-500">{t('common:webhookSettings.emailDesc')}</p>
                  </div>
                  <Switch 
                    checked={localPrefs.email} 
                    onCheckedChange={(val) => handleTogglePref('email', val)}
                  />
                </div>

                {/* 3. Slack */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t('common:webhookSettings.slack')}</p>
                    <p className="text-xs text-slate-500">{t('common:webhookSettings.slackDesc')}</p>
                  </div>
                  <Switch 
                    checked={localPrefs.slack} 
                    onCheckedChange={(val) => handleTogglePref('slack', val)}
                  />
                </div>

                {/* 4. MS Teams */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t('common:webhookSettings.msTeams')}</p>
                    <p className="text-xs text-slate-500">{t('common:webhookSettings.msTeamsDesc')}</p>
                  </div>
                  <Switch 
                    checked={localPrefs.msTeams} 
                    onCheckedChange={(val) => handleTogglePref('msTeams', val)}
                  />
                </div>

                {/* 5. Generic Webhook */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 sm:col-span-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t('common:webhookSettings.genericWebhook')}</p>
                    <p className="text-xs text-slate-500">{t('common:webhookSettings.genericWebhookDesc')}</p>
                  </div>
                  <Switch 
                    checked={localPrefs.genericWebhook} 
                    onCheckedChange={(val) => handleTogglePref('genericWebhook', val)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl shadow-indigo-100/20 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Loading notifications...</p>
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center gap-4 bg-slate-50/50">
                <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100">
                  <BellIcon className="h-12 w-12 text-slate-200" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">{t('notifications.empty')}</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto italic font-medium">
                    {t('notifications.emptyDetail')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedNotifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-6 transition-all hover:bg-slate-50/80 flex items-start gap-4 group relative",
                      !n.readStatus && "bg-indigo-50/30"
                    )}
                  >
                    {!n.readStatus && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                    )}
                    
                    <div className="mt-1 shrink-0">
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                        {getIcon(n.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className={cn(
                          "text-sm tracking-tight",
                          n.readStatus ? "font-bold text-slate-700" : "font-black text-slate-900"
                        )}>
                          {n.title || n.type.toUpperCase()}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 tabular-nums uppercase">
                          <Clock className="h-3 w-3" />
                          {format(new Date(n.createdAt), 'HH:mm, d MMM yyyy')}
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-xs leading-relaxed max-w-2xl",
                        n.readStatus ? "text-slate-500 font-medium" : "text-slate-600 font-semibold"
                      )}>
                        {n.message}
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        {n.link && (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-xs font-black uppercase text-indigo-600 hover:text-indigo-700 gap-1"
                            onClick={() => navigate(n.link!)}
                          >
                            <ExternalLink className="h-3 w-3" /> View Details
                          </Button>
                        )}
                        {!n.readStatus && (
                          <Button 
                            variant="ghost" 
                            className="p-0 h-auto text-xs font-black uppercase text-slate-400 hover:text-indigo-600 gap-1"
                            onClick={() => markReadMutation.mutate(n.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          className="p-0 h-auto text-xs font-black uppercase text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                          onClick={() => deleteMutation.mutate(n.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
