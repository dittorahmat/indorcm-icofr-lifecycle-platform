import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  readStatus: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { t, i18n } = useTranslation(['csa_hub', 'common']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const locale = i18n.language === 'id' ? id : enUS;

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api<Notification[]>('/api/notifications');
      return res || [];
    },
    refetchInterval: 60000, // Full list less frequent
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api<{ count: number }>('/api/notifications/unread-count'),
    refetchInterval: 15000, // Unread count more frequent
  });

  const unreadCount = unreadData?.count ?? notifications.filter(n => !n.readStatus).length;

  const markReadMutation = useMutation({
    mutationFn: () => api('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
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

  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) => api(`/api/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (n: Notification) => {
    if (!n.readStatus) {
      markSingleReadMutation.mutate(n.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-white/10 text-inherit">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center bg-red-500 text-white border-none text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="p-4 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest">{t('notifications.title')}</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-indigo-600 hover:text-indigo-700 p-0 font-bold uppercase tracking-tighter"
                onClick={(e) => {
                  e.stopPropagation();
                  markReadMutation.mutate();
                }}
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-red-600 hover:text-red-700 p-0 font-bold uppercase tracking-tighter"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllMutation.mutate();
                }}
              >
                {t('notifications.clearAll')}
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-xs">
              {t('notifications.empty')}
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <DropdownMenuItem 
                  key={n.id} 
                  className={cn(
                    "p-4 cursor-pointer focus:bg-slate-50 flex gap-3 items-start border-b last:border-0 group",
                    !n.readStatus && "bg-indigo-50/30"
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex flex-col gap-1 flex-grow">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale })}
                    </span>
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
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full h-8 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 uppercase tracking-widest"
            onClick={() => navigate('/notifications')}
          >
            {t('notifications.viewAll')}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
