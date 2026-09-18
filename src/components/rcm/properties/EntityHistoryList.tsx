import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChangeLog } from '@shared/types';

export function EntityHistoryList({ entityId }: { entityId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['changelogs', entityId],
    queryFn: () => api<{ items: ChangeLog[] }>(`/api/changelogs?entityId=${entityId}`),
    enabled: !!entityId
  });

  if (isLoading) return <div className="p-8 text-center"><RefreshCw className="h-4 w-4 animate-spin mx-auto text-slate-300" /></div>;
  if (!data?.items?.length) return <div className="p-12 text-center text-slate-400 italic text-xs border-2 border-dashed rounded-xl">Belum ada riwayat perubahan regulasi untuk entitas ini.</div>;

  return (
    <div className="space-y-3 p-1">
      {data.items.map((log) => (
        <div key={log.id} className="border rounded-xl p-3 bg-white shadow-sm text-xs space-y-2 border-slate-100">
           <div className="flex justify-between items-center">
              <span className="font-black text-indigo-600 uppercase tracking-tight">{log.userId.split('@')[0]}</span>
              <span className="text-slate-400 font-medium">{format(log.timestamp, 'dd MMM yyyy HH:mm')}</span>
           </div>
           <div className="text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100/50">
             <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs h-4 bg-white uppercase">{log.entityType}</Badge>
                <span className="text-slate-400">Changed mapping/metadata:</span>
             </div>
             <p className="font-medium text-slate-800 italic">"{log.descriptionAfter}"</p>
             {log.descriptionBefore && (
               <p className="text-xs text-slate-400 mt-1 line-through decoration-red-200">Before: {log.descriptionBefore}</p>
             )}
           </div>
        </div>
      ))}
    </div>
  );
}
