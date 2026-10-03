import React from 'react';
import { Bell, CheckCheck, Info, AlertTriangle, AlertCircle, Trash2, X } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  message: string;
  link?: string;
  readStatus: boolean;
  createdAt: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export function NotificationCenter() {
  const { t } = useTranslation(['csa_hub', 'common']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<Notification[]>('/api/notifications'),
    refetchInterval: 300000, // Refresh setiap 5 menit
  });

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api(`/api/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api('/api/notifications/clear-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (n: Notification) => {
    if (!n.readStatus) {
      markAsReadMutation.mutate(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-slate-100">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 hover:bg-red-700 border-2 border-white text-xs font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-xl border-slate-200" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 flex-wrap gap-2">
          <h3 className="font-bold text-sm text-slate-900">{t('notifications.title')}</h3>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-indigo-600 hover:text-indigo-700 p-0 font-semibold"
                onClick={() => markAllAsReadMutation.mutate()}
              >
                <CheckCheck className="h-3 w-3 mr-1" /> {t('notifications.markAllRead')}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-red-600 hover:text-red-700 p-0 font-semibold"
                onClick={() => clearAllMutation.mutate()}
              >
                <Trash2 className="h-3 w-3 mr-1" /> {t('notifications.clearAll')}
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-slate-50 relative group",
                    !n.readStatus && "bg-indigo-50/30"
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  {!n.readStatus && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                  )}
                  <div className="flex gap-3">
                    <div className={cn(
                      "mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                      n.type === 'warning' ? "bg-amber-100 text-amber-600" :
                      n.type === 'error' ? "bg-red-100 text-red-600" :
                      n.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      {n.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                       n.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                       <Info className="h-4 w-4" />}
                    </div>
                    <div className="space-y-1 flex-grow">
                      <p className={cn(
                        "text-[13px] leading-snug",
                        !n.readStatus ? "font-semibold text-slate-900" : "text-slate-600"
                      )}>
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: id })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 -mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(n.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t bg-slate-50/50">
          <Button 
            variant="ghost" 
            className="w-full h-8 text-xs text-slate-500 hover:text-slate-900"
            onClick={() => navigate('/notifications')}
          >
            {t('notifications.viewAll')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
